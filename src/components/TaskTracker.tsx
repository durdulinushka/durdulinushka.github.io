import MultiTaskTracker from "./MultiTaskTracker";

interface TaskTrackerProps {
  dailyHours: number;
  employeeId: string;
}

const TaskTracker = ({ dailyHours, employeeId }: TaskTrackerProps) => {
  return (
    <MultiTaskTracker 
      dailyHours={dailyHours} 
      employeeId={employeeId} 
    />
  );
};

export default TaskTracker;