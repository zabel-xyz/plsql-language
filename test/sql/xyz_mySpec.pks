CREATE OR REPLACE PACKAGE MyPackageSep
as
  /**
   * Comment
   */
  function get_myValue(param1 in varchar2)
    return varchar2;

  /**
   * Comment
   */
  procedure set_myValue(param1 in varchar2);

end;
/