CREATE OR REPLACE PACKAGE MyPackage
as
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

create or replace package body MyPackage
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
    MyPackage.myCall('test');
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
  begin
    -- some code to execute
    MyPackage2.myCall('Test');
    MyFunc('Test');
    return;
  end;

end;
/
