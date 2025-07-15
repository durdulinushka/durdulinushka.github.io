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

    // Получаем все завершенные ежедневные задачи с вчерашней датой
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: completedDailyTasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('task_type', 'daily')
      .eq('status', 'completed')
      .eq('due_date', yesterdayStr);

    if (fetchError) {
      console.error('Error fetching completed daily tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${completedDailyTasks?.length || 0} completed daily tasks from yesterday`);

    if (!completedDailyTasks || completedDailyTasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No completed daily tasks found for duplication',
          duplicated: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Создаем новые задачи на сегодня
    const today = new Date().toISOString().split('T')[0];
    const tasksToCreate = completedDailyTasks.map((task: Task) => ({
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id,
      priority: task.priority,
      task_type: task.task_type,
      due_date: today,
      department: task.department,
      creator_id: task.creator_id,
      status: 'pending'
    }));

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