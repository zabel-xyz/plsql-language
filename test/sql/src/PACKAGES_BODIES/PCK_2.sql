CREATE OR REPLACE PACKAGE BODY "schema"."PCK_2"
as

  procedure myProcedure(param1 in varchar2)
  is
  begin
    -- some code to execute
    return;
  end;

  procedure myFunction(param1 in varchar2) return number
  is
  begin
    -- some code to execute
    PCK$1.my$procedure('test');
    return 4;
  end;

end;
/
