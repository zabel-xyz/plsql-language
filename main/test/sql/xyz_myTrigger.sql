CREATE OR REPLACE TRIGGER schema.myTrigger
      BEFORE INSERT OR UPDATE OF salary, job_id ON myTable
      FOR EACH ROW
         WHEN (new.job_id <> 'AD_VP')
            myPackage.get_myValue()
      -- pl/sql_block
