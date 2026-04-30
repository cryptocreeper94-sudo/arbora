import { motion } from "framer-motion";
import { Info } from "lucide-react";

export function LivingCatalogBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-5"
      data-testid="living-catalog-banner"
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">Living Catalog</p>
          <p className="text-xs text-emerald-400/70 mt-1">
            This is a living catalog that grows every day. We are building the most comprehensive outdoor reference
            in the country, covering thousands of locations, species, and activities. New entries are added daily.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
