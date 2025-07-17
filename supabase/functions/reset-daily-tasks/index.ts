// Edge function для сброса статуса ежедневных задач каждый день
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Starting daily tasks status reset...');

    // Получаем все ежедневные задачи, которые были выполнены
    const { data: completedDailyTasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('task_type', 'daily')
      .eq('status', 'completed');

    if (fetchError) {
      console.error('Error fetching completed daily tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${completedDailyTasks?.length || 0} completed daily tasks to reset`);

    if (!completedDailyTasks || completedDailyTasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No completed daily tasks found to reset',
          reset: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Сбрасываем статус всех выполненных ежедневных задач на 'pending'
    const { data: updatedTasks, error: updateError } = await supabaseClient
      .from('tasks')
      .update({ 
        status: 'pending',
        completed_at: null 
      })
      .eq('task_type', 'daily')
      .eq('status', 'completed')
      .select();

    if (updateError) {
      console.error('Error resetting daily tasks status:', updateError);
      throw updateError;
    }

    console.log(`Successfully reset ${updatedTasks?.length || 0} daily tasks to pending status`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully reset ${updatedTasks?.length || 0} daily tasks`,
        reset: updatedTasks?.length || 0,
        tasks: updatedTasks
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reset-daily-tasks function:', error);
    
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