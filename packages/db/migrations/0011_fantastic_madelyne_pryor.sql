ALTER TABLE "feedback" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "idx_feedback_ip_created" ON "feedback" USING btree ("ip_hash","created_at");