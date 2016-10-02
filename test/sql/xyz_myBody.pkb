create or replace package body MyPackageSep
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
    -- some code to execute
    return;
  end;

end;
/
