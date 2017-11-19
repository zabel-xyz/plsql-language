CREATE OR REPLACE PACKAGE BODY PCK_1
as

  procedure myProcedure(param1 in varchar2)
  is
  begin
    -- some code to execute
    PCK_2.myProcedure('toto');
    return;
  end;

end;
/
