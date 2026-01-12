-- Add year column to SequenceGenerator if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='SequenceGenerator') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SequenceGenerator' AND column_name='year') THEN
            ALTER TABLE "SequenceGenerator" ADD COLUMN "year" INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
            CREATE INDEX IF NOT EXISTS "SequenceGenerator_clinicId_year_idx" ON "SequenceGenerator"("clinicId", "year");
        END IF;
    END IF;
END $$;
