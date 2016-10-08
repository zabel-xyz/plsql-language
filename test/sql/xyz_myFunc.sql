CREATE OR REPLACE FUNCTION MyFunc(param1 varchar2) return varchar2
is

  function myNestedFunc(param1 varchar2)
    return varchar2
  is
  begin
    return param1||'_TEST';
  end;

begin
  myPackage.myCall(param1);
  return myNestedFunc(param1);
end;