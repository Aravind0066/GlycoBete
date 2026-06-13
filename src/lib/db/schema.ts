import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  mode: text("mode", { enum: ["patient", "family"] }).notNull().default("patient"),
  class: text("class", { enum: ["warrior", "mage", "healer"] }).notNull().default("warrior"),
  age: text("age").notNull().default(""),
  gender: text("gender").notNull().default(""),
  diabetesType: text("diabetes_type").notNull().default(""),
  medications: text("medications").notNull().default(""),
  theme: text("theme", { enum: ["midnight", "forest", "sunrise", "ocean"] })
    .notNull()
    .default("midnight"),
  emergencyContact: text("emergency_contact").notNull().default(""),
  emergencyPhone: text("emergency_phone").notNull().default(""),
  doctorName: text("doctor_name").notNull().default(""),
  doctorPhone: text("doctor_phone").notNull().default(""),
  bloodGroup: text("blood_group").notNull().default(""),
});

export const gameStates = sqliteTable("game_states", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  totalXP: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  levelTitle: text("level_title").notNull().default("ROOKIE"),
  streak: integer("streak").notNull().default(0),
  lastCheckinDate: text("last_checkin_date").notNull().default(""),
  healthCoins: integer("health_coins").notNull().default(0),
  achievements: text("achievements").notNull().default("[]"),
  bossDefeated: integer("boss_defeated", { mode: "boolean" }).notNull().default(false),
  bossWeekStart: text("boss_week_start").notNull().default(""),
  activeQuest: text("active_quest"),
});

export const dayLogs = sqliteTable("day_logs", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  data: text("data").notNull(),
});

export const partyMembers = sqliteTable("party_members", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
});

export const prescriptionMeds = sqliteTable("prescription_meds", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  meds: text("meds").notNull().default("[]"),
});
