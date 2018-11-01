CREATE OR REPLACE FUNCTION MyFunc(param1 varchar2) return varchar2
is

  /**
   * function myNestedFunc
   */
  -- function myNestedFunc
  function myNestedFunc(param1 varchar2)
    return varchar2
  is
  begin
    return param1||'_TEST';
  end;

  xyz MyPackage2.txyz_myType;
  abc MyPackage.ttxyz_myType;

begin
  myPackage.myCall(param1);
  schema.MyProc(param1);

  if x = schema.MyPackage.myConst
  if y = MyPackage2.myGlobalVar

  return myNestedFunc(param1);
end;
