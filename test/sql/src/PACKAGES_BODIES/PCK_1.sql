CREATE OR REPLACE PACKAGE BODY "schema"."PCK_1"
as

  procedure myProcedure(param1 in varchar2)
  is
    lnumber number;
  begin
    -- some code to execute
    lnumber = PCK_2.myFunction('toto');
    PCK_2.myProcedure('toto');
    return;
  end;

end;
/
