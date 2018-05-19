create or replace package body MyPackage2
as

  function get_myValue(param1 in varchar2)
    return varchar2
  is
  begin
    return param1 || ' TEST';
  end;

  procedure set_myValue(param1 in varchar2)
  is
  begin
    MyPackage2.myCall('test');
    pCallInternal('test2');
    -- some other code to execute
    return;
  end;

  procedure myCall(param1 in varchar2)
  is
  begin
    -- some code to execute
    return;
  end;

  procedure pCallInternal(param1 in varchar2)
  is
    xyz MyPackage.txyz_myType;
    abc ttxyz_myType;
  begin
    -- some code to execute
    MyPackage.myCall('Test');
    MyFunc('Test');
    MyProc('Test');
    schema.MyProc('Test');

    if x = schema.MyPackage2.myConst
    if y = myGlobalVar

    -- complete
    MyPackage.
    -- complete
    MyPackage.myV

    return;
  end;

end;
/
