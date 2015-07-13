/*
//
// mdxparser.jison
// MDX Parser for Alamdx.js
// Date: 23.11.2014, 13.07.2015
// (c) 2014-2015, Andrey Gershun
//
*/

%lex
%options case-insensitive
%%

\[([^\]])*?\]	   								 return 'BRALITERAL'

(['](\\.|[^']|\\\')*?['])+                       return 'STRING'
(["](\\.|[^"]|\\\")*?["])+                       return 'STRING'

\/\*(.*?)\*\/									return /* skip comments */
"--"(.*?)($|\r\n|\r|\n)							return /* return 'COMMENT' */

\s+                                             /* skip whitespace */
'AXIS'											return 'AXIS'
'CHAPTERS'										return 'CHAPTERS'
'COLUMNS'										return 'COLUMNS'
'EMPTY'											return 'EMPTY'
'FROM'											return 'FROM'
'HAVING'										return 'HAVING'
'NON'											return 'NON'
'ON'											return 'ON'
'PAGES'											return 'PAGES'
'ROWS'											return 'ROWS'
'SECTIONS'										return 'SECTIONS'
'SELECT'										return 'SELECT'
'WHERE'                                         return 'WHERE'

(\d*[.])?\d+									return 'NUMBER'
'+'												return 'PLUS'
'-' 											return 'MINUS'
'*'												return 'STAR'
'/'												return 'SLASH'
'%'												return 'PERCENT'
'>='											return 'GE'
'>'												return 'GT'
'<='											return 'LE'
'<>'											return 'NE'
'<'												return 'LT'
'='												return 'EQ'
'!='											return 'NE'
'('												return 'LPAR'
')'												return 'RPAR'
'{'												return 'LCUR'
'}'												return 'RCUR'

'.'												return 'DOT'
','												return 'COMMA'
':'												return 'COLON'
';'												return 'SEMICOLON'
'$'												return 'DOLLAR'
'?'												return 'QUESTION'
'&'												return 'AMPERSAND'

[a-zA-Z_][a-zA-Z_0-9]*                       	return 'LITERAL'
<<EOF>>               							return 'EOF'
.												return 'INVALID'

/lex
%
%left COMMA
%left OR
%left AND
%left GT GE LT LE EQ NE
%left IN
%left NOT
%left LIKE
%left PLUS MINUS
%left STAR SLASH PERCENT
%left DOT
/* %left UMINUS */

%ebnf
%start main

%%

Literal
	: LITERAL
		{  }
	| BRALITERAL
		{  }
	| AMPERSAND BRALITERAL
		{  }
	;

main
	: MdxStatement
	;

MdxStatement
	: Select	
	;

WithClause
	: WITH 
	;

Select
/*	: WithClause? SelectClause FromClause HavingClause? WhereClause?
*/	: SELECT OnList FROM Literal 
	;

/*
SelectClause
	: SELECT OnList
	;
*/

OnList
	: OnList COMMA OnClause
	| OnClause
	;

OnClause
	: SetClause ON ROWS
	| SetClause ON COLUMNS
	| SetClause ON PAGES
	| SetClause ON SECTIONS
	| SetClause ON CHAPTERS
	| SetClause ON AXIS LPAR NUMBER RPAR
	| SetClause ON NUMBER
	;

SetClause
	: Set
	| NON EMPTY Set
	;

Set
	: LCUR ExprList RCUR
	| Literal
	;

FromClause
	: FROM Literal
	;

HavingClause
	: HAVING Expression
	;

Expression
	: Set
	| Set Op Set
 	| LPAR Expression RPAR
 	| Literal LPAR ExprList RPAR
	;

ExprList
	: ExprList COMMA Expression
	| Expression
	;

Op
	: DOT
	| STAR
	| SLASH
	| PLUS
	| MINUS
	| GT
	| GE
	| LT
	| LE
	| EQ
	| NE
	;

WhereClause
	: WHERE Expression
	;

