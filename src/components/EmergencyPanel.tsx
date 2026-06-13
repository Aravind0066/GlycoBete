import { motion, AnimatePresence } from "framer-motion";
import { Phone, User, Droplet, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

interface EmergencyPanelProps {
  profile: UserProfile;
  onUpdate?: (p: UserProfile) => void;
}

export function EmergencyPanel({ profile, onUpdate }: EmergencyPanelProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    emergencyContact: profile.emergencyContact,
    emergencyPhone: profile.emergencyPhone,
    doctorName: profile.doctorName,
    doctorPhone: profile.doctorPhone,
    bloodGroup: profile.bloodGroup,
  });

  const hasInfo =
    profile.emergencyContact || profile.doctorName || profile.bloodGroup;

  const save = async () => {
    const updated = await api.updateEmergency(form);
    onUpdate?.(updated);
    setEditing(false);
    toast.success("Emergency info saved");
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/40 px-4 py-2 text-red-300 backdrop-blur-sm hover:bg-red-950/60 transition-colors"
      >
        <AlertTriangle size={14} />
        <span className="font-display text-[8px]">EMERGENCY</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[var(--theme-card)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xs text-red-400">🚨 EMERGENCY PANEL</h2>
                <button onClick={() => setOpen(false)} className="text-[var(--theme-muted)]">
                  <X size={18} />
                </button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  {[
                    ["Emergency Contact", "emergencyContact"],
                    ["Emergency Phone", "emergencyPhone"],
                    ["Doctor Name", "doctorName"],
                    ["Doctor Phone", "doctorPhone"],
                    ["Blood Group", "bloodGroup"],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-xs text-[var(--theme-muted)]">{label}</label>
                      <input
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-fg)]"
                      />
                    </div>
                  ))}
                  <button
                    onClick={save}
                    className="w-full rounded-full bg-red-600 py-3 font-display text-[10px] text-white"
                  >
                    SAVE
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <InfoRow icon={User} label="Emergency Contact" value={profile.emergencyContact} />
                  <InfoRow icon={Phone} label="Emergency Phone" value={profile.emergencyPhone} />
                  <InfoRow icon={User} label="Doctor" value={profile.doctorName} />
                  <InfoRow icon={Phone} label="Doctor Phone" value={profile.doctorPhone} />
                  <InfoRow icon={Droplet} label="Blood Group" value={profile.bloodGroup} />

                  {!hasInfo && (
                    <p className="text-sm text-[var(--theme-muted)] text-center py-2">
                      Add your emergency details for quick access.
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    {profile.emergencyPhone && (
                      <a
                        href={`tel:${profile.emergencyPhone}`}
                        className="flex-1 rounded-full bg-red-600 py-3 text-center font-display text-[10px] text-white"
                      >
                        CALL EMERGENCY
                      </a>
                    )}
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-1 rounded-full border border-[var(--theme-border)] py-3 font-display text-[10px] text-[var(--theme-fg)]"
                    >
                      {hasInfo ? "EDIT" : "ADD INFO"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--theme-bg)]/50 p-3">
      <Icon size={16} className="text-red-400 shrink-0" />
      <div>
        <p className="text-[10px] text-[var(--theme-muted)]">{label}</p>
        <p className="text-sm text-[var(--theme-fg)]">{value || "—"}</p>
      </div>
    </div>
  );
}
