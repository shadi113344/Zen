import { motion } from "framer-motion";

interface DashboardFabProps {
  onClick: () => void;
}

export function DashboardFab({ onClick }: DashboardFabProps) {
  return (
    <motion.button
      type="button"
      className="dashboard-fab"
      onClick={onClick}
      aria-label="Add widget"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <span className="dashboard-fab__icon">+</span>
    </motion.button>
  );
}
