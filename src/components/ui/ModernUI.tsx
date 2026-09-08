"use client";
import { useI18n } from "@/i18n/provider";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";

// ============================================
// ANIMATION VARIANTS
// ============================================

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
};

// ============================================
// ANIMATED COUNTER
// ============================================

export const AnimatedCounter = ({
  value,
  prefix = "",
  suffix = "",
  duration = 1,
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate: (v) => setDisplayValue(v),
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ============================================
// ANIMATED CONTAINER
// ============================================

export const AnimatedContainer = ({
  children,
  delay = 0,
  className = "",
  animation = "fadeInUp",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animation?:
    | "fadeInUp"
    | "fadeInScale"
    | "slideInFromLeft"
    | "slideInFromRight";
}) => {
  const animations = {
    fadeInUp,
    fadeInScale,
    slideInFromLeft,
    slideInFromRight,
  };

  return (
    <motion.div
      initial={animations[animation].initial}
      animate={animations[animation].animate}
      exit={animations[animation].exit}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// GLASS CARD
// ============================================

export const GlassCard = ({
  children,
  className = "",
  hover = true,
  gradient = false,
  gradientColors = "from-white/80 to-white/60",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  gradientColors?: string;
}) => (
  <motion.div
    whileHover={
      hover
        ? { y: -4, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }
        : undefined
    }
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={`
      relative overflow-hidden
      ${gradient ? `bg-gradient-to-br ${gradientColors}` : "bg-white/70"}
      backdrop-blur-xl rounded-3xl
      shadow-xl shadow-gray-200/40
      border border-white/50
      ${className}
    `}
  >
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// ============================================
// GRADIENT CARD WITH GLOW
// ============================================

export const GradientCard = ({
  children,
  gradient = "from-indigo-500 via-purple-500 to-pink-500",
  className = "",
  glowColor = "indigo",
}: {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
  glowColor?: "indigo" | "purple" | "pink" | "emerald" | "blue" | "amber";
}) => {
  const glowColors = {
    indigo: "shadow-indigo-500/30",
    purple: "shadow-purple-500/30",
    pink: "shadow-pink-500/30",
    emerald: "shadow-emerald-500/30",
    blue: "shadow-blue-500/30",
    amber: "shadow-amber-500/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${gradient}
        rounded-3xl p-[1px]
        shadow-2xl ${glowColors[glowColor]}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
      <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-900/95 rounded-[calc(1.5rem-1px)] backdrop-blur-xl">
        {children}
      </div>
    </motion.div>
  );
};

// ============================================
// MODERN STATS CARD
// ============================================

export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  gradient = "from-indigo-500 to-purple-600",
  lightGradient = "from-indigo-50 to-purple-50",
  iconBg = "from-indigo-500 to-purple-600",
  animateValue = true,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  gradient?: string;
  lightGradient?: string;
  iconBg?: string;
  animateValue?: boolean;
  delay?: number;
}) => {
  const trendStyles = {
    up: { color: "text-emerald-600", bg: "bg-emerald-50", icon: "↗" },
    down: { color: "text-red-600", bg: "bg-red-50", icon: "↘" },
    neutral: { color: "text-gray-600", bg: "bg-gray-50", icon: "→" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
      className="group relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100/80"
    >
      {/* Animated background gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${lightGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Floating orbs decoration */}
      <div
        className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-shadow duration-300`}
          >
            {icon}
          </div>
          {trend && trendValue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${trendStyles[trend].bg} ${trendStyles[trend].color}`}
            >
              <span>{trendStyles[trend].icon}</span>
              <span>{trendValue}</span>
            </motion.div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 tracking-wide">
            {title}
          </p>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MINI BAR CHART
// ============================================

export const MiniBarChart = ({
  data,
  color = "#6366f1",
  height = 48,
  showLabels = false,
  labels = [],
}: {
  data: number[];
  color?: string;
  height?: number;
  showLabels?: boolean;
  labels?: string[];
}) => {
  const max = Math.max(...data);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((value, index) => (
          <motion.div
            key={index}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: `${(value / max) * 100}%`, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: index * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="flex-1 rounded-t-lg cursor-pointer group relative"
            style={{ backgroundColor: color, minHeight: "4px" }}
            whileHover={{ scale: 1.1 }}
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {value}
            </div>
          </motion.div>
        ))}
      </div>
      {showLabels && labels.length > 0 && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <span key={index} className="text-xs text-gray-400">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// SPARKLINE CHART
// ============================================

export const SparklineChart = ({
  data,
  color = "#6366f1",
  height = 40,
  showArea = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div style={{ height }} className="w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {showArea && (
          <motion.polygon
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 0.8 }}
            points={areaPoints}
            fill={color}
          />
        )}
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ============================================
// DONUT CHART
// ============================================

export const DonutChart = ({
  data,
  colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"],
  size = 140,
  strokeWidth = 20,
  showLegend = false,
}: {
  data: { label: string; value: number }[];
  colors?: string[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}) => {
  const { t: __tr } = useI18n();

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const currentOffset = offset;
            offset += percentage;

            return (
              <motion.circle
                key={index}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray }}
                transition={{
                  duration: 1,
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                strokeDashoffset={-(currentOffset / 100) * circumference}
                strokeLinecap="round"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">{__tr("Total")}</span>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// ACTIVITY TIMELINE
// ============================================

export const ActivityTimeline = ({
  items,
}: {
  items: {
    title: string;
    subtitle?: string;
    time: string;
    icon: React.ReactNode;
    color: string;
  }[];
}) => (
  <div className="relative space-y-6">
    {/* Connecting line */}
    <div className="absolute left-4 top-8 bottom-4 w-0.5 bg-gradient-to-b from-gray-200 to-transparent" />

    {items.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="relative flex items-start gap-4 pl-1"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`relative z-10 w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-white text-sm shrink-0 shadow-lg`}
        >
          {item.icon}
        </motion.div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-sm font-semibold text-gray-900">
            {item.title}
          </div>
          {item.subtitle && (
            <div className="text-sm text-gray-600">{item.subtitle}</div>
          )}
          <div className="text-xs text-gray-400 mt-1">{item.time}</div>
        </div>
      </motion.div>
    ))}
  </div>
);

// ============================================
// STATUS BADGE
// ============================================

export const StatusBadge = ({
  status,
  size = "md",
  pulse = false,
  label,
}: {
  status: "success" | "warning" | "error" | "info" | "pending" | "active";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  label?: string;
}) => {
  const { t: __tr } = useI18n();

  const statusStyles = {
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      border: "border-emerald-200",
    },
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      border: "border-emerald-200",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      border: "border-amber-200",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      border: "border-red-200",
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-200",
    },
    pending: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      dot: "bg-gray-400",
      border: "border-gray-200",
    },
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-sm",
  };

  const defaultLabels = {
    success: __tr("Success"),
    active: __tr("Active"),
    warning: __tr("Warning"),
    error: __tr("Error"),
    info: __tr("Info"),
    pending: __tr("Pending"),
  };

  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${style.bg} ${style.text} ${style.border} ${sizeStyles[size]}`}
    >
      <span className={`relative w-1.5 h-1.5 rounded-full ${style.dot}`}>
        {pulse && (
          <span
            className={`absolute inset-0 rounded-full ${style.dot} animate-ping opacity-75`}
          />
        )}
      </span>
      {label || defaultLabels[status]}
    </span>
  );
};

// ============================================
// MODERN BUTTON
// ============================================

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  icon,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500",
    secondary:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30",
    success:
      "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-200
        ${variants[variant]} ${sizes[size]}
        ${disabled || loading ? "opacity-60 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
};

// ============================================
// PAGE HEADER
// ============================================

export const PageHeader = ({
  title,
  subtitle,
  icon,
  action,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    {breadcrumbs && (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            {crumb.href ? (
              <a
                href={crumb.href}
                className="hover:text-gray-900 transition-colors"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    )}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            {title}
          </h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  </motion.div>
);

// ============================================
// DATA TABLE
// ============================================

export const DataTable = ({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyIcon = "📋",
  emptyMessage,
}: {
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  data: any[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
}) => {
  const { t: __tr } = useI18n();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-200/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-gray-500">{__tr("Loading...")}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-5xl">{emptyIcon}</span>
                    <span className="text-gray-500">
                      {emptyMessage ?? __tr("No data available")}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.03 }}
                  onClick={() => onRowClick?.(row)}
                  className={`
                  bg-white hover:bg-gray-50/80 transition-colors
                  ${onRowClick ? "cursor-pointer" : ""}
                `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm text-gray-700"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// SIDEBAR NAVIGATION
// ============================================

export const SidebarNav = ({
  items,
  activeItem,
  onItemClick,
  footer,
}: {
  items: { id: string; label: string; icon: React.ReactNode; badge?: string }[];
  activeItem: string;
  onItemClick: (id: string) => void;
  footer?: React.ReactNode;
}) => (
  <div className="flex flex-col h-full">
    <nav className="flex-1 px-3 py-4 space-y-1">
      {items.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onItemClick(item.id)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium
            transition-all duration-200
            ${
              activeItem === item.id
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }
          `}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span
              className={`
              px-2 py-0.5 text-[10px] rounded-full font-semibold
              ${
                activeItem === item.id
                  ? "bg-white/20 text-white"
                  : "bg-indigo-100 text-indigo-600"
              }
            `}
            >
              {item.badge}
            </span>
          )}
        </motion.button>
      ))}
    </nav>
    {footer && <div className="p-4 border-t border-gray-100">{footer}</div>}
  </div>
);

// ============================================
// MODAL
// ============================================

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}) => {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`relative w-full ${sizes[size]} bg-white rounded-3xl shadow-2xl overflow-hidden`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                ✕
              </motion.button>
            </div>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// SEARCH INPUT
// ============================================

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
    />
  </div>
);

// ============================================
// TABS
// ============================================

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}) => (
  <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl">
    {tabs.map((tab) => (
      <motion.button
        key={tab.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(tab.id)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
          ${
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }
        `}
      >
        {tab.icon && <span>{tab.icon}</span>}
        {tab.label}
      </motion.button>
    ))}
  </div>
);

// ============================================
// PROGRESS BAR
// ============================================

export const ProgressBar = ({
  value,
  max = 100,
  color = "indigo",
  size = "md",
  showLabel = false,
}: {
  value: number;
  max?: number;
  color?: "indigo" | "emerald" | "amber" | "red" | "purple";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    indigo: "from-indigo-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    red: "from-red-500 to-rose-500",
    purple: "from-purple-500 to-pink-500",
  };

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      <div
        className={`w-full bg-gray-100 rounded-full overflow-hidden ${heights[size]}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full`}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// AVATAR
// ============================================

export const Avatar = ({
  src,
  name,
  size = "md",
  status,
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
}) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    away: "bg-amber-500",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-xl object-cover border-2 border-white shadow-lg`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg`}
        >
          {initials}
        </div>
      )}
      {status && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColors[status]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

// ============================================
// SKELETON LOADER
// ============================================

export const Skeleton = ({
  className = "",
  variant = "rectangle",
}: {
  className?: string;
  variant?: "rectangle" | "circle" | "text";
}) => {
  const variants = {
    rectangle: "rounded-xl",
    circle: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 background-animate ${variants[variant]} ${className}`}
    />
  );
};

// ============================================
// NOTIFICATION TOAST
// ============================================

export const Toast = ({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}) => {
  const types = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      icon: "✓",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "✕",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: "⚠",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "ℹ",
    },
  };

  const style = types[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${style.bg} ${style.border} shadow-lg`}
    >
      <span className={`text-lg ${style.text}`}>{style.icon}</span>
      <span className={`flex-1 text-sm font-medium ${style.text}`}>
        {message}
      </span>
      <button onClick={onClose} className={`${style.text} hover:opacity-70`}>
        ✕
      </button>
    </motion.div>
  );
};

// ============================================
// EMPTY STATE
// ============================================

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
    )}
    {action}
  </motion.div>
);

// Re-export legacy Card for backward compatibility
export const Card = GlassCard;
