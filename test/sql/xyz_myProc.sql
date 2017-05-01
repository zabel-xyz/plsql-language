CREATE OR REPLACE PROCEDURE schema.MyProc(param1 varchar2)
is

  /**
   * procedure myNestedProc
   */
  function myNestedProc(param1 varchar2)
    return varchar2
  is
  begin
    return param1||'_TEST';
  end;

  x varchar2(10);
begin
  myPackage.myCall(param1);
  x := schema.MyFunc(param1);
  myNestedProc(param1);
end;
