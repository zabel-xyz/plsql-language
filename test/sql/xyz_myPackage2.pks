CREATE OR REPLACE PACKAGE MyPackage2
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

  procedure callTo(param1 in varchar2);

end;
/