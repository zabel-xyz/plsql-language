CREATE OR REPLACE EDITIONABLE PACKAGE demo IS
  PROCEDURE with_alternative_quotes;  
  PROCEDURE symbol_not_recognized;  
END demo;
/

CREATE OR REPLACE EDITIONABLE PACKAGE BODY demo IS

  PROCEDURE with_alternative_quotes IS
    v_example VARCHAR2(32767);
  BEGIN
    v_example := q'^

Some multiline text to demonstrate the alternative quoting.

We use here a single ' quote to show that for example SQL-Developer is 
able to compile this package.

If we use inside our text pairing quotes it should not break anything:

```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  

End of the story. <-- This "end" inside the text breaks the symbol recognition!

If you remove it, the symbol recognition is working again. Syntax highlighting
is not working at all with alternative quotes.

Seems that we have a combined error: The wrong string literal recognition with 
alternative quotes is breaking the syntax highlighting and the symbol recognition.

More examples here: 
https://livesql.oracle.com/apex/livesql/file/content_CIREYU9EA54EOKQ7LAMZKRF6P.html

^';

    v_example := q'(
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
)';

    v_example := q'[
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
]';

    v_example := q'{
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'<Some text with a single ' quote.>';
END;
```  
}';

    v_example := q'<
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}';
END;
```  
>';

    v_example := q'|
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
|';

    v_example := q'!
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
!';

    v_example := q'#
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
#';

    v_example := q'`
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
`';

    v_example := q'^
```sql
DECLARE
  v_test varchar2(1000);
BEGIN
v_test := 
    q'(Some text with a single ' quote.)' ||
    q'[Some text with a single ' quote.]' ||
    q'{Some text with a single ' quote.}' ||
    q'<Some text with a single ' quote.>';
END;
```  
^';

  END with_alternative_quotes;

  PROCEDURE symbol_not_recognized IS
  BEGIN
    NULL;
  END symbol_not_recognized;

END demo;
/