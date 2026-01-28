import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Card, CardContent, cn } from "@platform/design-system";

interface StatCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accentColorClassName?: string;
  className?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon, accentColorClassName, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={className}
      {...props}
    >
      <Card
        variant="elevated"
        padding="md"
        className={cn(accentColorClassName)}
        style={{ borderLeft: "4px solid", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <CardContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 0 }}>
          <div>
            <p style={{ fontSize: "0.875rem", color: "#737373" }}>{title}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#171717" }}>{value}</p>
          </div>
          <div style={{ fontSize: "1.5rem", color: "#404040" }} aria-hidden="true">
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  ),
);

StatCard.displayName = "StatCard";

export default StatCard;
