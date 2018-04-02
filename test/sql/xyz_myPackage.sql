CREATE OR REPLACE PACKAGE schema.MyPackage
as

  type txyz_myType is record(
      myChar varchar2
    , myNumber number
    , myField myTable.myField%type
  );
  type ttxyz_myType is table of txyz_myType;

  myConst constant char(2) := '10';
  myGlobalVar number := 10;

  /**
   * Comment
   */
  function get_myValue(param1 in varchar2)
    return varchar2;

  /**
   * Comment
   *
   * procedure set_myValue
   *
   */
  procedure set_myValue(param1 in varchar2);

  procedure myCall(param1 in varchar2);

end;
/

create or replace package body schema.MyPackage
as

  -- function get_myValue
  function get_myValue(param1 in varchar2)
    return varchar2
  is
  begin
    return param1 || ' TEST';
  end;

  procedure set_myValue(param1 in varchar2)
  is
  begin
    MyPackage.myCall('test');
    schema.MyPackage.myCall('test2');
    pCallInternal('test3');
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
    xyz MyPackage2.txyz_myType;
    abc ttxyz_myType;
  begin
    -- some code to execute
    MyPackage2.myCall('Test');
    MyFunc('Test');
    MyProc('Test');
    schema.MyProc('Test');

    if x = schema.MyPackage.myConst
    if y = myGlobalVar

    return;
  end;

end;
/
