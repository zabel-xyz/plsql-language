CREATE OR REPLACE PACKAGE "schema"."PCK_2"
as
  procedure myProcedure(param1 in varchar2);
  function myFunction(param1 in varchar2) return number;
end;
/