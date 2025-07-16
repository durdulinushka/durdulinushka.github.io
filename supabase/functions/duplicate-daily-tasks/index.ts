// Edge function для автоматического дублирования ежедневных задач
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  priority: string;
  task_type: string;
  due_date: string | null;
  department: string;
  creator_id: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily tasks duplication...');

    // Получаем все ежедневные задачи-шаблоны (без дат или бессрочные)
    const { data: dailyTasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('task_type', 'daily')
      .or('due_date.is.null,start_date.is.null'); // Шаблонные задачи без дат

    if (fetchError) {
      console.error('Error fetching daily tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dailyTasks?.length || 0} daily tasks for duplication`);

    if (!dailyTasks || dailyTasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No daily tasks found for duplication',
          duplicated: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Проверяем, есть ли уже задачи на завтра для каждого сотрудника
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tasksToCreate = [];

    for (const task of dailyTasks) {
      // Проверяем, есть ли уже такая задача на завтра
      const { data: existingTask } = await supabaseClient
        .from('tasks')
        .select('id')
        .eq('title', task.title)
        .eq('assignee_id', task.assignee_id)
        .eq('task_type', 'daily')
        .eq('start_date', tomorrowStr)
        .single();

      if (!existingTask) {
        tasksToCreate.push({
          title: task.title,
          description: task.description,
          assignee_id: task.assignee_id,
          priority: task.priority,
          task_type: task.task_type,
          start_date: tomorrowStr,
          due_date: tomorrowStr, // Должна быть выполнена в тот же день
          department: task.department,
          creator_id: task.creator_id,
          status: 'pending'
        });
      }
    }

    if (tasksToCreate.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All daily tasks already exist for tomorrow',
          duplicated: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: createdTasks, error: createError } = await supabaseClient
      .from('tasks')
      .insert(tasksToCreate)
      .select();

    if (createError) {
      console.error('Error creating new daily tasks:', createError);
      throw createError;
    }

    console.log(`Successfully created ${createdTasks?.length || 0} new daily tasks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully duplicated ${createdTasks?.length || 0} daily tasks`,
        duplicated: createdTasks?.length || 0,
        tasks: createdTasks
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in duplicate-daily-tasks function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});