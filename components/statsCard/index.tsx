"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card p-5 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 flex justify-between items-start shadow-xl"
    >
      <div className="space-y-2">
        <p className="text-xs text-white/50 uppercase font-semibold tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-white tracking-tight">
          {value}
        </h3>
        {change && (
          <p className="text-xs text-orange-400 font-medium">{change}</p>
        )}
      </div>

      {Icon && (
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-orange-400">
          <Icon size={24} />
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;