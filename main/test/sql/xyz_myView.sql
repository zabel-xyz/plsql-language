CREATE OR REPLACE NO FORCE VIEW myView (
    CustomerName, ContactName
)
AS
SELECT CustomerName, ContactName
FROM myTable
WHERE Country = "Brazil";