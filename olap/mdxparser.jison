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
		{  $$ = $1; }
	| BRALITERAL
		{  $$ = $1.substr(1,$1.length-2); }
	;

main
	: Select EOF
		{ 
			$$ = $1; 
			console.log($$); 
			return $$; 
		}	
	;

Select
/*	: WithClause? SelectClause FromClause HavingClause? WhereClause?
*/	: SELECT OnList FROM Literal 
		{ $$ = {select: $2, from: $4}; }	
	;

WithClause
	: WITH 
	;

/*
SelectClause
	: SELECT OnList
	;
*/

OnList
	: OnList COMMA OnClause
		{ $$ = $1; $$.push($3); }
	| OnClause
		{ $$ = [$1]; }
	;

OnClause
	: SetClause ON COLUMNS
		{ $$ = {axis:1, set: $1}; }
	| SetClause ON ROWS
		{ $$ = {axis:2, set: $1}; }
	| SetClause ON PAGES
		{ $$ = {axis:3, set: $1}; }
	| SetClause ON SECTIONS
		{ $$ = {axis:4, set: $1}; }
	| SetClause ON CHAPTERS
		{ $$ = {axis:5, set: $1}; }
	| SetClause ON AXIS LPAR NUMBER RPAR
		{ $$ = {axis:+$5, set: $1}; }
	| SetClause ON NUMBER
		{ $$ = {axis:+$3, set: $1}; }
	;

SetClause
	: Set
		{ $$ = $1; }
	| NON EMPTY Set
		{ $$ = {nonempty:true, set:$3}; }
	;

Set
	: LCUR ExprList RCUR
		{ $$ = $2; }
	| Literal
		{ $$ = $1; }
	| AMPERSAND Literal
		{  $$ = {ampersand: $2}; }
	;

/*
FromClause
	: FROM Literal
		{ $$ = $2; }
	;
*/
/*
HavingClause
	: HAVING Expression
	;
*/
Expression
	: Set
		{ $$ = {set:$1}; }
	| Set Op Set
		{ $$ = {op:$2,left:$1,right:$3}; }
 	| LPAR Expression RPAR
 		{ $$ = $2; }
 	| Literal LPAR ExprList RPAR
 		{ $$ = {funcid:$1,args:$3}; }
	;

ExprList
	: ExprList COMMA Expression
		{ $$ = $1; $$.push($3); }
	| Expression
		{ $$ = [$1]; }
	;

Op
	: DOT { $$ = '.'; }
	| STAR  { $$ = '*'; }
	| SLASH { $$ = '/'; }
	| PLUS { $$ = '+'; }
	| MINUS { $$ = '-'; }
	| GT { $$ = '>'; }
	| GE { $$ = '>='; }
	| LT { $$ = '<'; }
	| LE { $$ = '<='; }
	| EQ { $$ = '='; }
	| NE { $$ = '!='; }
	;

WhereClause
	: WHERE Expression
		{ $$ = $2; }
	;

