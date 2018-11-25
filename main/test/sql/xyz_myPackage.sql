CREATE OR REPLACE PACKAGE schema.MyPackage
as

  bulk_error exception;
  pragma exception_init(bulk_error, -24381);

  type txyz_myType is record(
      myChar varchar2
    , myNumber number
    , myField myTable.myField%type
  );
  type ttxyz_myType is table of txyz_myType;

  myConst constant char(2) := '10';
  myGlobalVar number := 10;

  -- Test conditional compilation
  $IF $$opt $THEN
    procedure conditional;
  $END

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

  bulk_error exception;
  pragma exception_init(bulk_error, -24381);

  type txyz_myType2 is record(
      myChar varchar2
    , myNumber number
    , myField myTable.myField%type
  );
  type ttxyz_myType2 is table of txyz_myType2;

  myConst2 constant char(2) := '10';
  myGlobalVar2 number := 10;

  -- forward declaration
  function pForward(param1 in varchar2)
    return varchar2;

  -- function get_myValue
  function get_myValue(param1 in varchar2)
    return varchar2
  is
  begin
    return param1 || ' TEST';
  end;

  function insideConditional return number
  is
  begin
    while false loop
      begin
        $if true $then
          null;
        $elsif $$no_op $then
          null;
        $end
      exception when others then
        null;
      end;
    end loop;
    return null;
  end;

  $IF $$opt $THEN
    procedure conditional;
  $END

  $IF $$opt $THEN
    procedure conditional is
    begin
      null;
    end;
  $END

  procedure quote is
  begin
    logger.log('end');
    -- end
    return null;
  end;

  procedure set_myValue(param1 in varchar2)
  is
  begin
    MyPackage.myCall('test');
    schema.MyPackage.myCall('test2');
    pCallInternal('test3');
    case
    end
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

    pForward('Test3');

    if x = schema.MyPackage.myConst
    if y = myGlobalVar

    -- complete
    MyPackage2.
    -- complete
    return MyPackage2.myV

    return;
  end;

  -- test with subfunction
  procedure pMainProcedure(param1 in varchar2)
  is
    x number;

    function pSubFunction(param1 in number)
    is
    begin
      -- some code to execute
      return 3;
    end pSubFunction;
  begin
    -- some code to execute

    -- call to subFunction
    x = pSubFunction(2);

    case
      case
      end
    end
  end pMainProcedure;

  function pForward(param1 in varchar2)
    return varchar2
  is
    xyz txyz_myType2;
    abc ttxyz_myType2;
  begin
    -- some code to execute
    if x = myConst2
    if y = myGlobalVar2

    return 'test';
  end;

end;
/
