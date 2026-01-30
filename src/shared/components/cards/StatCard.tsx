import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Card, CardContent, cn } from "@sarradahub/design-system";

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
        className={cn(
          "flex items-center justify-between border-l-4",
          accentColorClassName,
        )}
      >
        <CardContent className="flex items-center justify-between w-full p-0">
          <div>
            <p className="text-sm text-neutral-500">{title}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
          </div>
          <div className="text-2xl text-neutral-700" aria-hidden="true">
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  ),
);

StatCard.displayName = "StatCard";

export default StatCard;
