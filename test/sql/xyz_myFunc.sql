CREATE OR REPLACE FUNCTION myFunc(param1 VARCHAR2) RETURN VARCHAR2
IS

    FUNCTION myNestedFunc(param1 VARCHAR2)
        RETURN VARCHAR2
    IS
    BEGIN
        yrstr := TO_CHAR(TO_NUMBER(year_string)*2);
        RETURN yrstr;
    END;

BEGIN
  RETURN myNestedFunc(param1)||'_TEST';
END;