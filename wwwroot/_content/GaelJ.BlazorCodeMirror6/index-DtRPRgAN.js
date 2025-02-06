import { E as ExternalTokenizer, C as ContextTracker, s as styleTags, t as tags, b as LRParser, L as LRLanguage, f as foldNodeProp, k as foldInside, i as indentNodeProp, c as continuedIndent, l as defineCSSCompletionSource, a as LanguageSupport } from './index-iQ4m41Mf.js';

// This file was generated by lezer-generator. You probably shouldn't edit it.
const indent = 148,
  dedent = 149,
  descendantOp = 150,
  InterpolationEnd = 1,
  InterpolationContinue = 2,
  Unit = 3,
  callee = 151,
  identifier = 152,
  VariableName = 4,
  InterpolationStart = 5,
  newline = 153,
  blankLineStart = 154,
  eof = 155,
  whitespace = 156,
  LineComment = 6,
  Comment = 7,
  IndentedMixin = 8,
  IndentedInclude = 9,
  Dialect_indented = 0;

/* Hand-written tokenizers for CSS tokens that can't be
   expressed by Lezer's built-in tokenizer. */

const space = [9, 10, 11, 12, 13, 32, 133, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197,
               8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288];
const colon = 58, parenL = 40, underscore = 95, bracketL = 91, dash = 45, period = 46,
      hash = 35, percent = 37, braceL = 123, braceR = 125, slash = 47, asterisk = 42,
      newlineChar = 10, equals = 61, plus = 43, and = 38;

function isAlpha(ch) { return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch >= 161 }

function isDigit(ch) { return ch >= 48 && ch <= 57 }

function startOfComment(input) {
  let next;
  return input.next == slash && ((next = input.peek(1)) == slash || next == asterisk)
}

const spaces = new ExternalTokenizer((input, stack) => {
  if (stack.dialectEnabled(Dialect_indented)) {
    let prev;
    if (input.next < 0 && stack.canShift(eof)) {
      input.acceptToken(eof);
    } else if (((prev = input.peek(-1)) == newlineChar || prev < 0) && stack.canShift(blankLineStart)) {
      let spaces = 0;
      while (input.next != newlineChar && space.includes(input.next)) { input.advance(); spaces++; }
      if (input.next == newlineChar || startOfComment(input))
        input.acceptToken(blankLineStart, -spaces);
      else if (spaces)
        input.acceptToken(whitespace);
    } else if (input.next == newlineChar) {
      input.acceptToken(newline, 1);
    } else if (space.includes(input.next)) {
      input.advance();
      while (input.next != newlineChar && space.includes(input.next)) input.advance();
      input.acceptToken(whitespace);
    }
  } else {
    let length = 0;
    while (space.includes(input.next)) {
      input.advance();
      length++;
    }
    if (length) input.acceptToken(whitespace);
  }
}, {contextual: true});

const comments = new ExternalTokenizer((input, stack) => {
  if (!startOfComment(input)) return
  input.advance();
  if (stack.dialectEnabled(Dialect_indented)) {
    let indentedComment = -1;
    for (let off = 1;; off++) {
      let prev = input.peek(-off - 1);
      if (prev == newlineChar || prev < 0) {
        indentedComment = off + 1;
        break
      } else if (!space.includes(prev)) {
        break
      }
    }
    if (indentedComment > -1) { // Weird indented-style comment
      let block = input.next == asterisk, end = 0;
      input.advance();
      while (input.next >= 0) {
        if (input.next == newlineChar) {
          input.advance();
          let indented = 0;
          while (input.next != newlineChar && space.includes(input.next)) {
            indented++;
            input.advance();
          }
          if (indented < indentedComment) {
            end = -indented - 1;
            break
          }
        } else if (block && input.next == asterisk && input.peek(1) == slash) {
          end = 2;
          break
        } else {
          input.advance();
        }
      }
      input.acceptToken(block ? Comment : LineComment, end);
      return
    }
  }
  if (input.next == slash) {
    while (input.next != newlineChar && input.next >= 0) input.advance();
    input.acceptToken(LineComment);
  } else {
    input.advance();
    while (input.next >= 0) {
      let {next} = input;
      input.advance();
      if (next == asterisk && input.next == slash) {
        input.advance();
        break
      }
    }
    input.acceptToken(Comment);
  }
});

const indentedMixins = new ExternalTokenizer((input, stack) => {
  if ((input.next == plus || input.next == equals) && stack.dialectEnabled(Dialect_indented))
    input.acceptToken(input.next == equals ? IndentedMixin : IndentedInclude, 1);
});

const indentation = new ExternalTokenizer((input, stack) => {
  if (!stack.dialectEnabled(Dialect_indented)) return
  let cDepth = stack.context.depth;
  if (input.next < 0 && cDepth) {
    input.acceptToken(dedent);
    return
  }
  let prev = input.peek(-1);
  if (prev == newlineChar) {
    let depth = 0;
    while (input.next != newlineChar && space.includes(input.next)) {
      input.advance();
      depth++;
    }
    if (depth != cDepth &&
        input.next != newlineChar && !startOfComment(input)) {
      if (depth < cDepth) input.acceptToken(dedent, -depth);
      else input.acceptToken(indent);
    }
  }
});

const identifiers = new ExternalTokenizer((input, stack) => {
  for (let inside = false, dashes = 0, i = 0;; i++) {
    let {next} = input;
    if (isAlpha(next) || next == dash || next == underscore || (inside && isDigit(next))) {
      if (!inside && (next != dash || i > 0)) inside = true;
      if (dashes === i && next == dash) dashes++;
      input.advance();
    } else if (next == hash && input.peek(1) == braceL) {
      input.acceptToken(InterpolationStart, 2);
      break
    } else {
      if (inside)
        input.acceptToken(next == parenL ? callee : dashes == 2 && stack.canShift(VariableName) ? VariableName : identifier);
      break
    }
  }
});

const interpolationEnd = new ExternalTokenizer(input => {
  if (input.next == braceR) {
    input.advance();
    while (isAlpha(input.next) || input.next == dash || input.next == underscore || isDigit(input.next))
      input.advance();
    if (input.next == hash && input.peek(1) == braceL)
      input.acceptToken(InterpolationContinue, 2);
    else
      input.acceptToken(InterpolationEnd);
  }
});

const descendant = new ExternalTokenizer(input => {
  if (space.includes(input.peek(-1))) {
    let {next} = input;
    if (isAlpha(next) || next == underscore || next == hash || next == period ||
        next == bracketL || next == colon || next == dash || next == and)
      input.acceptToken(descendantOp);
  }
});

const unitToken = new ExternalTokenizer(input => {
  if (!space.includes(input.peek(-1))) {
    let {next} = input;
    if (next == percent) { input.advance(); input.acceptToken(Unit); }
    if (isAlpha(next)) {
      do { input.advance(); } while (isAlpha(input.next))
      input.acceptToken(Unit);
    }
  }
});

function IndentLevel(parent, depth) {
  this.parent = parent;
  this.depth = depth;
  this.hash = (parent ? parent.hash + parent.hash << 8 : 0) + depth + (depth << 4);
}

const topIndent = new IndentLevel(null, 0);

const trackIndent = new ContextTracker({
  start: topIndent,
  shift(context, term, stack, input) {
    if (term == indent) return new IndentLevel(context, stack.pos - input.pos)
    if (term == dedent) return context.parent
    return context
  },
  hash(context) { return context.hash }
});

const cssHighlighting = styleTags({
  "AtKeyword import charset namespace keyframes media supports include mixin use forward extend at-root": tags.definitionKeyword,
  "Keyword selector": tags.keyword,
  "ControlKeyword": tags.controlKeyword,
  NamespaceName: tags.namespace,
  KeyframeName: tags.labelName,
  TagName: tags.tagName,
  "ClassName Suffix": tags.className,
  PseudoClassName: tags.constant(tags.className),
  IdName: tags.labelName,
  "FeatureName PropertyName": tags.propertyName,
  AttributeName: tags.attributeName,
  NumberLiteral: tags.number,
  KeywordQuery: tags.keyword,
  UnaryQueryOp: tags.operatorKeyword,
  "CallTag ValueName": tags.atom,
  VariableName: tags.variableName,
  SassVariableName: tags.special(tags.variableName),
  Callee: tags.operatorKeyword,
  Unit: tags.unit,
  "UniversalSelector NestingSelector IndentedMixin IndentedInclude": tags.definitionOperator,
  MatchOp: tags.compareOperator,
  "ChildOp SiblingOp, LogicOp": tags.logicOperator,
  BinOp: tags.arithmeticOperator,
  "Important Global Default": tags.modifier,
  Comment: tags.blockComment,
  LineComment: tags.lineComment,
  ColorLiteral: tags.color,
  "ParenthesizedContent StringLiteral": tags.string,
  "InterpolationStart InterpolationContinue InterpolationEnd": tags.meta,
  ": \"...\"": tags.punctuation,
  "PseudoOp #": tags.derefOperator,
  "; ,": tags.separator,
  "( )": tags.paren,
  "[ ]": tags.squareBracket,
  "{ }": tags.brace
});

// This file was generated by lezer-generator. You probably shouldn't edit it.
const spec_identifier = {__proto__:null,not:62, only:62, using:173, with:183, without:183, hide:197, show:197, from:220, to:222, if:235, through:241, in:247};
const spec_callee = {__proto__:null,url:80, "url-prefix":80, domain:80, regexp:80, lang:94, "nth-child":94, "nth-last-child":94, "nth-of-type":94, "nth-last-of-type":94, dir:94, "host-context":94, selector:166};
const spec_AtKeyword = {__proto__:null,"@import":150, "@include":170, "@mixin":176, "@function":176, "@use":180, "@extend":186, "@at-root":190, "@forward":194, "@media":200, "@charset":204, "@namespace":208, "@keyframes":214, "@supports":226, "@if":230, "@else":232, "@for":238, "@each":244, "@while":250, "@debug":254, "@warn":254, "@error":254, "@return":254};
const parser = LRParser.deserialize({
  version: 14,
  states: "I^Q`Q+tOOO#cQ+tOOP#jOpOOO#oQ(pO'#CjOOQ#U'#Ci'#CiO%[Q)QO'#FrO%oQ.jO'#CnO&gQ#dO'#DWO'^Q(pO'#CgO'eQ)OO'#DYO'pQ#dO'#DaO'uQ#dO'#DeOOQ#U'#Fr'#FrO'zQ(pO'#FrO(RQ(nO'#DpO%oQ.jO'#DwO%oQ.jO'#ESO%oQ.jO'#EVO%oQ.jO'#EXO(WQ)OO'#E[O(uQ)OO'#E^O%oQ.jO'#E`O)SQ)OO'#EcO%oQ.jO'#EeO)nQ)OO'#EgO)yQ#dO'#EjO*OQ)OO'#EpO*dQ)OO'#FQOOQ&Z'#Fq'#FqOOQ&Y'#FT'#FTO*nQ(nO'#FTQ`Q+tOOO%oQ.jO'#ErO*yQ(nO'#EvO+OQ)OO'#EyO%oQ.jO'#E|O%oQ.jO'#FOOOQ&Z'#F['#F[O+WQ+uO'#FyO+eQ(oO'#FyQOQ#SOOP+yO#SO'#FpPOOO)CAe)CAeOOQ#U'#Cm'#CmOOQ#U,59W,59WOOQ#i'#Cp'#CpO%oQ.jO'#CsO,XQ.wO'#CuO.qQ.^O,59YO%oQ.jO'#CzOOQ#S'#DO'#DOO/SQ(nO'#DTOOQ#i'#Fs'#FsO/XQ(nO'#C}OOQ#U'#DX'#DXOOQ#U,59r,59rO&gQ#dO,59rO/^Q)OO,59tO'pQ#dO,59{O'uQ#dO,5:PO(WQ)OO,5:TO(WQ)OO,5:VO(WQ)OO,5:WO(WQ)OO'#FZO/iQ(nO,59RO/tQ+tO'#DnO/{Q#TO'#DnOOQ&Z,59R,59ROOQ#U'#D['#D[OOQ#S'#D_'#D_OOQ#U,59t,59tO0QQ(nO,59tO0VQ(nO,59tOOQ#U'#Dc'#DcOOQ#U,59{,59{OOQ#S'#Dg'#DgO0[Q9`O,5:PO0dQ.jO,5:[O0nQ.jO,5:cO1gQ.jO,5:nO1tQ.YO,5:qO2VQ.jO,5:sOOQ#U'#Cj'#CjO2{Q(pO,5:vO3YQ(pO,5:xOOQ&Z,5:x,5:xO3aQ)OO,5:xO3fQ.jO,5:zOOQ#S'#Dz'#DzO4RQ)OO'#EPO4YQ(nO'#F{O*OQ)OO'#EOO4nQ(nO'#EQOOQ#S'#F|'#F|O/lQ(nO,5:}O2YQ.YO,5;POOQ#d'#Ei'#EiO*nQ(nO,5;RO4sQ)OO,5;ROOQ#S'#El'#ElO4{Q(nO,5;UO5QQ(nO,5;[O5]Q(nO,5;lOOQ&Z'#Fz'#FzOOQ&Y,5;o,5;oOOQ&Y-E9R-E9RO1tQ.YO,5;^O5kQ)OO,5;bO5pQ)OO'#GOO5xQ)OO,5;eO1tQ.YO,5;hO2YQ.YO,5;jOOQ&Z-E9Y-E9YO5}Q(oO,5<eO6cQ+uO'#F^O5}Q(oO,5<ePOO#S'#FS'#FSP6yO#SO,5<[POOO,5<[,5<[O7XQ.YO,59_OOQ#i,59a,59aO%oQ.jO,59cO%oQ.jO,59hO%oQ.jO'#FWO7gQ#WO1G.tOOQ#k1G.t1G.tO7oQ.oO,59fO:UQ! lO,59oO;RQ.jO'#DPOOQ#i,59i,59iOOQ#U1G/^1G/^OOQ#U1G/`1G/`O0QQ(nO1G/`O0VQ(nO1G/`OOQ#U1G/g1G/gO;]Q9`O1G/kO;vQ(pO1G/oO<jQ(pO1G/qO=^Q(pO1G/rO>QQ(pO,5;uOOQ#S-E9X-E9XOOQ&Z1G.m1G.mO>_Q(nO,5:YO>dQ+uO,5:YO>kQ)OO'#D`O>rQ.jO'#D^OOQ#U1G/k1G/kO%oQ.jO1G/kO>yQ.kO1G/vOOQ#T1G/v1G/vO*nQ(nO1G/}O?vQ+uO'#FzOOQ&Z1G0Y1G0YO/XQ(nO1G0YOOQ&Z1G0]1G0]OOQ&Z1G0_1G0_O/XQ(nO1G0_OOQ&Z1G0b1G0bOOQ&Z1G0d1G0dOB`Q)OO1G0dOBeQ(nO1G0dOBjQ)OO1G0fOOQ&Z1G0f1G0fOBxQ.jO'#F`OCYQ(nO'#DzOCeQ(nO,5:gOCjQ(nO,5:kO*OQ)OO,5:iOCrQ)OO'#F_ODVQ(nO,5<gODhQ(nO,5:jO(WQ)OO,5:lOOQ&Z1G0i1G0iOOQ&Z1G0k1G0kOOQ&Z1G0m1G0mO*nQ(nO1G0mOEPQ)OO'#EmOOQ&Z1G0p1G0pOOQ&Z1G0v1G0vOOQ&Z1G1W1G1WOE_Q+uO1G0xO%oQ.jO1G0|OGwQ)OO'#FdOHSQ)OO,5<jO%oQ.jO1G1POOQ&Z1G1S1G1SOOQ&Z1G1U1G1UOH[Q(oO1G2POHpQ+uO,5;xOOQ#T,5;x,5;xOOQ#T-E9[-E9[POO#S-E9Q-E9QPOOO1G1v1G1vOOQ#i1G.y1G.yOIWQ.oO1G.}OOQ#i1G/S1G/SOKmQ.^O,5;rOOQ#W-E9U-E9UOOQ#k7+$`7+$`OLOQ(nO1G/ZOLTQ.jO'#FUOM_Q.jO'#FvONvQ.jO'#FsON}Q(nO,59kOOQ#U7+$z7+$zOOQ#U7+%V7+%VO%oQ.jO7+%VOOQ&Z1G/t1G/tO! SQ#TO1G/tO! XQ(pO'#FxO! cQ(nO,59zO! hQ.jO'#FwO! rQ(nO,59xO! wQ.YO7+%VO!!VQ.kO'#F]O%oQ.jO'#F]O!#vQ.kO7+%bOOQ#T7+%b7+%bOOQ&Z7+%i7+%iO5]Q(nO7+%tO*nQ(nO7+%yO!$jQ(nO7+&OO*OQ)OO7+&OOOQ#d-E9^-E9^OOQ&Z7+&Q7+&QO!$oQ.jO'#F}OOQ#d,5;z,5;zO%oQ.jO1G0ROOQ#S1G0V1G0VOOQ#S1G0T1G0TO!%ZQ(nO,5;yOOQ#S-E9]-E9]O!%oQ(pO1G0WOOQ&Z7+&X7+&XO!%vQ(vO'#CuO/lQ(nO'#FbO!&RQ)OO,5;XOOQ&Z,5;X,5;XO!&aQ+uO7+&dO!(yQ)OO7+&dO!)UQ.jO7+&hOOQ#d,5<O,5<OOOQ#d-E9b-E9bO1tQ.YO7+&kOOQ#T1G1d1G1dOOQ#i7+$u7+$uOOQ#d-E9S-E9SO!)gQ.jO'#FVO!)tQ(nO,5<bO!)tQ(nO,5<bO%oQ.jO,5<bOOQ#i1G/V1G/VO!)|Q.YO<<HqOOQ&Z7+%`7+%`O!*[Q)OO'#FYO!*fQ(nO,5<dOOQ#U1G/f1G/fO!*nQ.jO'#FXO!*xQ(nO,5<cOOQ#U1G/d1G/dOOQ#U<<Hq<<HqO!+QQ.kO,5;wOOQ#e-E9Z-E9ZOOQ#T<<H|<<H|OOQ&Z<<I`<<I`OOQ&Z<<Ie<<IeO*OQ)OO<<IjO!,qQ(nO<<IjO!,yQ.jO'#FaO!-^Q)OO,5<iO!-oQ.jO7+%mOOQ#S7+%r7+%rOOQ#d,5;|,5;|OOQ#d-E9`-E9`OOQ&Z1G0s1G0sOOQ&Z-E9a-E9aO!(yQ)OO<<JOO%oQ.jO,5;}OOQ&Z<<JO<<JOO%oQ.jO<<JSOOQ&Z<<JV<<JVO!-vQ.jO,5;qO!.TQ.jO,5;qOOQ#S-E9T-E9TO!.[Q(nO1G1|O!.dQ.jO1G1|OOQ#UAN>]AN>]O!.nQ(pO,5;tOOQ#S-E9W-E9WO!.xQ.jO,5;sOOQ#S-E9V-E9VO!/SQ(nOAN?UO/lQ(nOAN?UO!/[Q.jO,5;{OOQ#d-E9_-E9_OOQ#S<<IX<<IXP!/vQ)OO'#FcOOQ&ZAN?jAN?jO1tQ.YO1G1iO1tQ.YOAN?nOOQ#S1G1]1G1]O%oQ.jO1G1]O!/{Q(nO7+'hO/lQ(nOG24pOOQ&ZG24pG24pOOQ&Z7+'T7+'TOOQ&ZG25YG25YO!0TQ.jO7+&wOOQ&ZLD*[LD*[",
  stateData: "!0e~O$bOSVOSUOS$`QQ~OS^OTUOWaOX`O[[O_TOc^OtXO}XO!UYO!YZO!lkO!m_O!w`O!zaO!|bO#PcO#RdO#TeO#WfO#YgO#[hO#_iO#ejO#gpO#kqO#nrO#qsO#stO$^RO$iVO~O$X$mP~P`O$`yO~Ot^Xt!eXv^X}^X!U^X!Y^X!^^X!a^X!c^X$[^X$_^X$i^X~Ot$fXv$fX}$fX!U$fX!Y$fX!^$fX!a$fX!c$fX$[$fX$_$fX$i$fX~O$^{O!i$fX$a$fXf$fXe$fX~P$gOS!UOTUO_!UOc!UOf!OOh!UOj!UOo!ROx!TO$]!SO$^}O$h!PO~O$^!WO~Ot!ZO}!ZO!U![O!Y!]O!^!^O!a!`O!c!cO$[!_O$_!dO$i!YO~Ov!aO~P&lO!P!jO$]!gO$^!fO~O$^!kO~O$^!mO~Ot!oO~P$gOt!oO~OTUO[[O_TOtXO}XO!UYO!YZO$^!tO$iVO~Of!xO!c!cO$_!dO~P(WOTUOc#POf!{Oo!}O!u#OO$^!zO!c$oP$_$oP~Oj#TOx!TO$^#SO~O$^#VO~OTUOc#POf!{Oo!}O!u#OO$^!zO~O!i$oP$a$oP~P)SO!i#ZO$_#ZO$a#ZO~Oc#_O~Oc#`O#o$rP~O$X$mX!j$mX$Z$mX~P`O!i#ZO$_#ZO$a#ZO$X$mX!j$mX$Z$mX~OU#hOV#hO$_#jO$b#hO~OR#lOPiXQiXliXmiX$iiXTiXciXfiXoiX!iiX!uiX$^iX$_iX$aiX!ciX!xiX!}iX#UiXeiXSiX_iXhiXjiXviXxiX!fiX!giX!hiX$]iX$hiX$XiXuiX!WiX#ciX#liX!jiX$ZiX~OP#qOQ#oOl#mOm#mO$i#nO~Of#sO~Of#tO~O!P#yO$]!gO$^!fO~Ov!aO!c!cO$_!dO~O!j$mP~P`O$Y$TO~Of$UO~Of$VO~O!W$WO![$XO~O!c!cO$_!dO~P%oOl#mOm#mO$i#nO!i$oP$_$oP$a$oP~P*OOl#mOm#mO!i#ZO$a#ZO$i#nO~O!c!cO!x$_O$_$]O~P1UOl#mOm#mO!c!cO$_!dO$i#nO~O!}$bO$_#ZO~P1UOt!ZO}!ZO!U![O!Y!]O!^!^O!a!`O$[!_O$i!YO~O!i#ZO$_#ZO$a#ZO~P2aOf$eO~P&lO!}$fO~O#U$iO$_#ZO~P1UOTUOc#POf!{Oo!}O!u#OO~O$^$jO~P3pOm$mOv$nO!c$oX$_$oX!i$oX$a$oX~Of$qO~Oj$uOx!TO~O!c$vO~Om$mO!c!cO$_!dO~O!c!cO!i#ZO$_$]O$a#ZO~O#b${O~Ov$|O#o$rX~O#o%OO~O!i#ZO$_#ZO$a#ZO$X$ma!j$ma$Z$ma~O!i$QX$X$QX$_$QX$a$QX!j$QX$Z$QX~P`OU#hOV#hO$_%WO$b#hO~Oe%XOl#mOm#mO$i#nO~OP%^OQ#oO~Ol#mOm#mO$i#nOPnaQnaTnacnafnaona!ina!una$^na$_na$ana!cna!xna!}na#UnaenaSna_nahnajnavnaxna!fna!gna!hna$]na$hna$Xnauna!Wna#cna#lna!jna$Zna~Oj%_Oy%_O~OS!UOTUO_!UOf!OOh!UOj!UOo!ROx!TO$]!SO$^}O$h!PO~Oc%bOe$jP~P:^O!W%eO![%fO~Ot!ZO}!ZO!U![O!Y!]O$i!YO~Ov!]i!^!]i!a!]i!c!]i$[!]i$_!]i!i!]i$a!]if!]ie!]i~P;eOv!_i!^!_i!a!_i!c!_i$[!_i$_!_i!i!_i$a!_if!_ie!_i~P;eOv!`i!^!`i!a!`i!c!`i$[!`i$_!`i!i!`i$a!`if!`ie!`i~P;eOv#}a!c#}a$_#}a~P2aO!j%gO~O$Z$mP~P`Oe$lP~P(WOe$kP~P%oOl#mOm#mOv%oO!f%qO!g%qO!h%qO$i#nO!i!di$_!di$a!di$X!di!j!di$Z!di~P%oO$Y$TOS$nXT$nXW$nXX$nX[$nX_$nXc$nXt$nX}$nX!U$nX!Y$nX!l$nX!m$nX!w$nX!z$nX!|$nX#P$nX#R$nX#T$nX#W$nX#Y$nX#[$nX#_$nX#e$nX#g$nX#k$nX#n$nX#q$nX#s$nX$X$nX$^$nX$i$nX!j$nX!i$nX$_$nX$a$nX$Z$nX~O!}%uO~Ot%vO~O!i#ZO#U$iO$_#ZO$a#ZO~O!i$qP#U$qP$_$qP$a$qP~P%oOe!nXm!nXt!pX~Ot%{O~Oe%|Om$mO~Ov$RX!c$RX$_$RX!i$RX$a$RX~P*OOv$nO!c$oa$_$oa!i$oa$a$oa~Om$mOv!ra!c!ra$_!ra!i!ra$a!rae!ra~O!j&VO#b&TO#c&TO$h&SO~O#h&XOS#fiT#fiW#fiX#fi[#fi_#fic#fit#fi}#fi!U#fi!Y#fi!l#fi!m#fi!w#fi!z#fi!|#fi#P#fi#R#fi#T#fi#W#fi#Y#fi#[#fi#_#fi#e#fi#g#fi#k#fi#n#fi#q#fi#s#fi$X#fi$^#fi$i#fi!j#fi!i#fi$_#fi$a#fi$Z#fi~Oc&ZOv$WX#o$WX~Ov$|O#o$ra~O!i#ZO$_#ZO$a#ZO$X$mi!j$mi$Z$mi~O!i$Qa$X$Qa$_$Qa$a$Qa!j$Qa$Z$Qa~P`O$i#nOPkiQkilkimkiTkickifkioki!iki!uki$^ki$_ki$aki!cki!xki!}ki#UkiekiSki_kihkijkivkixki!fki!gki!hki$]ki$hki$Xkiuki!Wki#cki#lki!jki$Zki~Ol#mOm#mO$i#nOP#zaQ#za~Oe&_O~Ol#mOm#mO$i#nOS#xXT#xX_#xXc#xXe#xXf#xXh#xXj#xXo#xXu#xXv#xXx#xX$]#xX$^#xX$h#xX~Ou&cOv&aOe$jX~P%oOS$gXT$gX_$gXc$gXe$gXf$gXh$gXj$gXl$gXm$gXo$gXu$gXv$gXx$gX$]$gX$^$gX$h$gX$i$gX~Ot&dO~PMlOe&eO~O$Z&gO~Ov&hOe$lX~P2aOe&jO~Ov&kOe$kX~P%oOe&mO~Ol#mOm#mO!W&nO$i#nO~Ol#mOm#mO$i#nOS$PXT$PX_$PXc$PXf$PXh$PXj$PXo$PXv$PXx$PX!f$PX!g$PX!h$PX!i$PX$]$PX$^$PX$_$PX$a$PX$h$PX$X$PX!j$PX$Z$PX~Ov%oO!f&qO!g&qO!h&qO!i!dq$_!dq$a!dq$X!dq!j!dq$Z!dq~P%oOt&tO~Ol#mOm#mOv&vO$i#nO!i$qX#U$qX$_$qX$a$qX~Om$mOv$Ra!c$Ra$_$Ra!i$Ra$a$Ra~Oe&yO~P2aOR#lO!ciX$_iX~O!j&|O#b&TO#c&TO$h&SO~O#h'OOS#fqT#fqW#fqX#fq[#fq_#fqc#fqt#fq}#fq!U#fq!Y#fq!l#fq!m#fq!w#fq!z#fq!|#fq#P#fq#R#fq#T#fq#W#fq#Y#fq#[#fq#_#fq#e#fq#g#fq#k#fq#n#fq#q#fq#s#fq$X#fq$^#fq$i#fq!j#fq!i#fq$_#fq$a#fq$Z#fq~O!c!cO#i'PO$_!dO~Ol#mOm#mO#c'RO#l'RO$i#nO~Oc'UOe#yXv#yX~P:^Ov&aOe$ja~Ol#mOm#mO!W'YO$i#nO~Oe#|Xv#|X~P(WOv&hOe$la~Oe#{Xv#{X~P%oOv&kOe$ka~Ol#mOm#mO$i#nOS$PaT$Pa_$Pac$Paf$Pah$Paj$Pao$Pav$Pax$Pa!f$Pa!g$Pa!h$Pa!i$Pa$]$Pa$^$Pa$_$Pa$a$Pa$h$Pa$X$Pa!j$Pa$Z$Pa~Oe'`Om$mO~Ov$TX!i$TX#U$TX$_$TX$a$TX~P%oOv&vO!i$qa#U$qa$_$qa$a$qa~Oe'cO~P%oOu'hOe#yav#ya~P%oOt'iO~PMlOv&aOe$ji~Ov&aOe$ji~P%oOe#|av#|a~P2aOe#{av#{a~P%oOe'kOm$mO~Ol#mOm#mO$i#nOv$Ta!i$Ta#U$Ta$_$Ta$a$Ta~O#i'PO~Ov&aOe$jq~Oe#yqv#yq~P%oO$h$il!al~",
  goto: "7g$sPPPPPPPPPPP$tP%O%cP%O%v%yP'iPP'iP(fP'iPP'iP'i'i)g*dPPP*mPP%O+p%OP+vP+|,S,Y%OP,`P%OP,fP%OP%O%OP,lP-}.aPPPPP$tPP']'].k']']']']P$tPP$tP$tPP$tP$tP$tPP$tP$tP$tP.n$tP.q.tPP$tP$tPPP$tPP$tPP$tP$tP$tP.w.}/T/s0R0X0_0e0k0w0}1X1_1e1k1q1wPPPPPPPPPPP1}2Q2^3TPP5W5Z5^5a5j6l6u7a7dalOPov!c#f$T%Ss[OPcdov!^!_!`!a!c#f$T$U$q%S&hsSOPcdov!^!_!`!a!c#f$T$U$q%S&hR|Tb[cd!^!_!`!a$U$q&h`]OPov!c#f$T%S!t!UU_`abegpst!O!R!o#m#n#o#t$V$X$Y$i${%O%a%f%k%o%p%{&a&d&k&v&x'P'R'T'X']'i'oe#Pfjk!p!{!}$m$n%v&t!u!UU_`abegpst!O!R!o#m#n#o#t$V$X$Y$i${%O%a%f%k%o%p%{&a&d&k&v&x'P'R'T'X']'i'o!t!UU_`abegpst!O!R!o#m#n#o#t$V$X$Y$i${%O%a%f%k%o%p%{&a&d&k&v&x'P'R'T'X']'i'oT&T$v&U!u!VU_`abegpst!O!R!o#m#n#o#t$V$X$Y$i${%O%a%f%k%o%p%{&a&d&k&v&x'P'R'T'X']'i'oQ#u!VQ%s$_R%t$b!t!UU_`abegpst!O!R!o#m#n#o#t$V$X$Y$i${%O%a%f%k%o%p%{&a&d&k&v&x'P'R'T'X']'i'oQ#ThR$u#UQ!XVR#v!YQ!hXR#w!ZQ#w!jR%d#yQ!iXR#x!ZQ#w!iR%d#xQ!lYR#z![Q!nZR#{!]Q!eWQ!wdQ$R!bQ$Z!oQ$^!qQ$`!rQ$d!vQ$r#QQ$x#XQ$y#YQ$z#^Q%P#bQ&r%sQ&z&TQ'Q&XQ'S&]Q'e'OQ'l'`Q'm'fQ'n'gR'p'kSnOoUwP!c$TQ#evQ%T#fR&^%Sa^OPov!c#f$T%SR$k!{R#UhR#WiR$w#WQ#iyR%V#iQoOR#]oQ%a#tQ%k$V^&`%a%k&x'T'X']'oQ&x%{Q'T&aQ'X&dQ']&kR'o'iQ&b%aU'V&b'W'jQ'W&cR'j'XQ#p!QR%]#pQ&l%kR'^&lQ&i%iR'[&iQ!bWR$Q!bUvP!c$TS#dv%SR%S#fQ%p$YR&p%pQ#gwQ%R#eT%U#g%RQ$o!|R&P$oQ$g!yR%w$gQ&w%yR'b&wQ&U$vR&{&UQ&W$zR&}&WQ$}#`R&[$}RzQSmOo]uPv!c#f$T%S`WOPov!c#f$T%SQ!ucQ!vdQ#|!^Q#}!_Q$O!`Q$P!aQ%i$UQ&Q$qR'Z&hQ!QUQ!p_Q!q`Q!raQ!sbQ!yeQ#RgQ#^pQ#bsQ#ctQ#k!OQ#r!RQ$Y!oQ%Y#mQ%Z#nQ%[#ol%`#t$V%a%k%{&a&d&k&x'T'X']'i'oQ%m$XS%n$Y%pQ%y$iQ&Y${Q&]%OQ&f%fQ&o%oQ'a&vQ'f'PR'g'RR%c#tR%l$VR%j$UQxPQ$S!cR%h$TQ#[nW#fw#e#g%RQ$^!qQ$a!sQ$c!uQ$h!yQ$s#RQ$t#TQ$y#YQ%Q#cQ%r$[Q%x$gQ&R$uQ&r%sR&s%tQ#QfQ#YkR$[!pU!|fk!pQ#XjQ$l!{Q$p!}Q%}$mQ&O$nQ&u%vR'_&tR%z$iR#ar",
  nodeNames: "⚠ InterpolationEnd InterpolationContinue Unit VariableName InterpolationStart LineComment Comment IndentedMixin IndentedInclude StyleSheet RuleSet UniversalSelector TagSelector TagName NestingSelector SuffixedSelector Suffix Interpolation SassVariableName ValueName ) ( ParenthesizedValue ColorLiteral NumberLiteral StringLiteral BinaryExpression BinOp LogicOp UnaryExpression LogicOp NamespacedValue CallExpression Callee ArgList : ... , CallLiteral CallTag ParenthesizedContent ClassSelector ClassName PseudoClassSelector :: PseudoClassName PseudoClassName ArgList PseudoClassName ArgList IdSelector # IdName ] AttributeSelector [ AttributeName MatchOp ChildSelector ChildOp DescendantSelector SiblingSelector SiblingOp Block { Declaration PropertyName Important Global Default ; } ImportStatement AtKeyword import KeywordQuery FeatureQuery FeatureName BinaryQuery UnaryQuery ParenthesizedQuery SelectorQuery selector IncludeStatement include Keyword MixinStatement mixin UseStatement use Keyword ExtendStatement extend RootStatement at-root ForwardStatement forward Keyword MediaStatement media CharsetStatement charset NamespaceStatement namespace NamespaceName KeyframesStatement keyframes KeyframeName KeyframeList Keyword Keyword SupportsStatement supports IfStatement ControlKeyword ControlKeyword Keyword ForStatement ControlKeyword Keyword EachStatement ControlKeyword Keyword WhileStatement ControlKeyword OutputStatement ControlKeyword AtRule Styles",
  maxTerm: 172,
  context: trackIndent,
  nodeProps: [
    ["openedBy", 1,"InterpolationStart",5,"InterpolationEnd",21,"(",72,"{"],
    ["closedBy", 22,")",65,"}"]
  ],
  propSources: [cssHighlighting],
  skippedNodes: [0,6,7,130],
  repeatNodeCount: 17,
  tokenData: "!!]~RyOq#rqr$jrs0jst2^tu8{uv;hvw;ywx<[xy=yyz>[z{>a{|>z|}Cm}!ODO!O!PDm!P!Q;h!Q![FW![!]GR!]!^G}!^!_H`!_!`Hw!`!aI`!a!b#r!b!cJa!c!}#r!}#OKy#O#P#r#P#QL[#Q#RLm#R#T#r#T#UMS#U#c#r#c#dNe#d#o#r#o#pNz#p#qLm#q#r! ]#r#s! n#s;'S#r;'S;=`!!V<%lO#rW#uSOy$Rz;'S$R;'S;=`$d<%lO$RW$WSyWOy$Rz;'S$R;'S;=`$d<%lO$RW$gP;=`<%l$RY$m[Oy$Rz!_$R!_!`%c!`#W$R#W#X%v#X#Z$R#Z#[)Z#[#]$R#]#^,V#^;'S$R;'S;=`$d<%lO$RY%jSyWlQOy$Rz;'S$R;'S;=`$d<%lO$RY%{UyWOy$Rz#X$R#X#Y&_#Y;'S$R;'S;=`$d<%lO$RY&dUyWOy$Rz#Y$R#Y#Z&v#Z;'S$R;'S;=`$d<%lO$RY&{UyWOy$Rz#T$R#T#U'_#U;'S$R;'S;=`$d<%lO$RY'dUyWOy$Rz#i$R#i#j'v#j;'S$R;'S;=`$d<%lO$RY'{UyWOy$Rz#`$R#`#a(_#a;'S$R;'S;=`$d<%lO$RY(dUyWOy$Rz#h$R#h#i(v#i;'S$R;'S;=`$d<%lO$RY(}S!hQyWOy$Rz;'S$R;'S;=`$d<%lO$RY)`UyWOy$Rz#`$R#`#a)r#a;'S$R;'S;=`$d<%lO$RY)wUyWOy$Rz#c$R#c#d*Z#d;'S$R;'S;=`$d<%lO$RY*`UyWOy$Rz#U$R#U#V*r#V;'S$R;'S;=`$d<%lO$RY*wUyWOy$Rz#T$R#T#U+Z#U;'S$R;'S;=`$d<%lO$RY+`UyWOy$Rz#`$R#`#a+r#a;'S$R;'S;=`$d<%lO$RY+yS!gQyWOy$Rz;'S$R;'S;=`$d<%lO$RY,[UyWOy$Rz#a$R#a#b,n#b;'S$R;'S;=`$d<%lO$RY,sUyWOy$Rz#d$R#d#e-V#e;'S$R;'S;=`$d<%lO$RY-[UyWOy$Rz#c$R#c#d-n#d;'S$R;'S;=`$d<%lO$RY-sUyWOy$Rz#f$R#f#g.V#g;'S$R;'S;=`$d<%lO$RY.[UyWOy$Rz#h$R#h#i.n#i;'S$R;'S;=`$d<%lO$RY.sUyWOy$Rz#T$R#T#U/V#U;'S$R;'S;=`$d<%lO$RY/[UyWOy$Rz#b$R#b#c/n#c;'S$R;'S;=`$d<%lO$RY/sUyWOy$Rz#h$R#h#i0V#i;'S$R;'S;=`$d<%lO$RY0^S!fQyWOy$Rz;'S$R;'S;=`$d<%lO$R~0mWOY0jZr0jrs1Vs#O0j#O#P1[#P;'S0j;'S;=`2W<%lO0j~1[Oj~~1_RO;'S0j;'S;=`1h;=`O0j~1kXOY0jZr0jrs1Vs#O0j#O#P1[#P;'S0j;'S;=`2W;=`<%l0j<%lO0j~2ZP;=`<%l0jZ2cY!UPOy$Rz!Q$R!Q![3R![!c$R!c!i3R!i#T$R#T#Z3R#Z;'S$R;'S;=`$d<%lO$RY3WYyWOy$Rz!Q$R!Q![3v![!c$R!c!i3v!i#T$R#T#Z3v#Z;'S$R;'S;=`$d<%lO$RY3{YyWOy$Rz!Q$R!Q![4k![!c$R!c!i4k!i#T$R#T#Z4k#Z;'S$R;'S;=`$d<%lO$RY4rYhQyWOy$Rz!Q$R!Q![5b![!c$R!c!i5b!i#T$R#T#Z5b#Z;'S$R;'S;=`$d<%lO$RY5iYhQyWOy$Rz!Q$R!Q![6X![!c$R!c!i6X!i#T$R#T#Z6X#Z;'S$R;'S;=`$d<%lO$RY6^YyWOy$Rz!Q$R!Q![6|![!c$R!c!i6|!i#T$R#T#Z6|#Z;'S$R;'S;=`$d<%lO$RY7TYhQyWOy$Rz!Q$R!Q![7s![!c$R!c!i7s!i#T$R#T#Z7s#Z;'S$R;'S;=`$d<%lO$RY7xYyWOy$Rz!Q$R!Q![8h![!c$R!c!i8h!i#T$R#T#Z8h#Z;'S$R;'S;=`$d<%lO$RY8oShQyWOy$Rz;'S$R;'S;=`$d<%lO$R_9O`Oy$Rz}$R}!O:Q!O!Q$R!Q![:Q![!_$R!_!`;T!`!c$R!c!}:Q!}#R$R#R#S:Q#S#T$R#T#o:Q#o;'S$R;'S;=`$d<%lO$RZ:X^yWcROy$Rz}$R}!O:Q!O!Q$R!Q![:Q![!c$R!c!}:Q!}#R$R#R#S:Q#S#T$R#T#o:Q#o;'S$R;'S;=`$d<%lO$R[;[S![SyWOy$Rz;'S$R;'S;=`$d<%lO$RY;mSlQOy$Rz;'S$R;'S;=`$d<%lO$RZ<OS_ROy$Rz;'S$R;'S;=`$d<%lO$R~<_WOY<[Zw<[wx1Vx#O<[#O#P<w#P;'S<[;'S;=`=s<%lO<[~<zRO;'S<[;'S;=`=T;=`O<[~=WXOY<[Zw<[wx1Vx#O<[#O#P<w#P;'S<[;'S;=`=s;=`<%l<[<%lO<[~=vP;=`<%l<[Z>OSfROy$Rz;'S$R;'S;=`$d<%lO$R~>aOe~_>hU[PlQOy$Rz!_$R!_!`;T!`;'S$R;'S;=`$d<%lO$RZ?RWlQ!aPOy$Rz!O$R!O!P?k!P!Q$R!Q![Bp![;'S$R;'S;=`$d<%lO$RZ?pUyWOy$Rz!Q$R!Q![@S![;'S$R;'S;=`$d<%lO$RZ@ZYyW$hROy$Rz!Q$R!Q![@S![!g$R!g!h@y!h#X$R#X#Y@y#Y;'S$R;'S;=`$d<%lO$RZAOYyWOy$Rz{$R{|An|}$R}!OAn!O!Q$R!Q![BV![;'S$R;'S;=`$d<%lO$RZAsUyWOy$Rz!Q$R!Q![BV![;'S$R;'S;=`$d<%lO$RZB^UyW$hROy$Rz!Q$R!Q![BV![;'S$R;'S;=`$d<%lO$RZBw[yW$hROy$Rz!O$R!O!P@S!P!Q$R!Q![Bp![!g$R!g!h@y!h#X$R#X#Y@y#Y;'S$R;'S;=`$d<%lO$RZCrSvROy$Rz;'S$R;'S;=`$d<%lO$RZDTWlQOy$Rz!O$R!O!P?k!P!Q$R!Q![Bp![;'S$R;'S;=`$d<%lO$RZDrW$iROy$Rz!O$R!O!PE[!P!Q$R!Q![@S![;'S$R;'S;=`$d<%lO$RYEaUyWOy$Rz!O$R!O!PEs!P;'S$R;'S;=`$d<%lO$RYEzSuQyWOy$Rz;'S$R;'S;=`$d<%lO$RZF][$hROy$Rz!O$R!O!P@S!P!Q$R!Q![Bp![!g$R!g!h@y!h#X$R#X#Y@y#Y;'S$R;'S;=`$d<%lO$RZGWUtROy$Rz![$R![!]Gj!];'S$R;'S;=`$d<%lO$RXGqS}PyWOy$Rz;'S$R;'S;=`$d<%lO$RZHSS!iROy$Rz;'S$R;'S;=`$d<%lO$RYHeUlQOy$Rz!_$R!_!`%c!`;'S$R;'S;=`$d<%lO$R^H|U![SOy$Rz!_$R!_!`%c!`;'S$R;'S;=`$d<%lO$RZIgV!^PlQOy$Rz!_$R!_!`%c!`!aI|!a;'S$R;'S;=`$d<%lO$RXJTS!^PyWOy$Rz;'S$R;'S;=`$d<%lO$RXJdWOy$Rz!c$R!c!}J|!}#T$R#T#oJ|#o;'S$R;'S;=`$d<%lO$RXKT[!lPyWOy$Rz}$R}!OJ|!O!Q$R!Q![J|![!c$R!c!}J|!}#T$R#T#oJ|#o;'S$R;'S;=`$d<%lO$RXLOS!YPOy$Rz;'S$R;'S;=`$d<%lO$R^LaS!WUOy$Rz;'S$R;'S;=`$d<%lO$R[LpUOy$Rz!_$R!_!`;T!`;'S$R;'S;=`$d<%lO$RZMVUOy$Rz#b$R#b#cMi#c;'S$R;'S;=`$d<%lO$RZMnUyWOy$Rz#W$R#W#XNQ#X;'S$R;'S;=`$d<%lO$RZNXSmRyWOy$Rz;'S$R;'S;=`$d<%lO$RZNhUOy$Rz#f$R#f#gNQ#g;'S$R;'S;=`$d<%lO$RZ! PS!cROy$Rz;'S$R;'S;=`$d<%lO$RZ! bS!jROy$Rz;'S$R;'S;=`$d<%lO$R]! sU!aPOy$Rz!_$R!_!`;T!`;'S$R;'S;=`$d<%lO$RW!!YP;=`<%l#r",
  tokenizers: [indentation, descendant, interpolationEnd, unitToken, identifiers, spaces, comments, indentedMixins, 0, 1, 2, 3],
  topRules: {"StyleSheet":[0,10],"Styles":[1,129]},
  dialects: {indented: 0},
  specialized: [{term: 152, get: value => spec_identifier[value] || -1},{term: 151, get: value => spec_callee[value] || -1},{term: 74, get: value => spec_AtKeyword[value] || -1}],
  tokenPrec: 2821
});

/**
A language provider based on the [Lezer Sass
parser](https://github.com/lezer-parser/sass), extended with
highlighting and indentation information.
*/
const sassLanguage = /*@__PURE__*/LRLanguage.define({
    name: "sass",
    parser: /*@__PURE__*/parser.configure({
        props: [
            /*@__PURE__*/foldNodeProp.add({
                Block: foldInside,
                Comment(node, state) {
                    return { from: node.from + 2, to: state.sliceDoc(node.to - 2, node.to) == "*/" ? node.to - 2 : node.to };
                }
            }),
            /*@__PURE__*/indentNodeProp.add({
                Declaration: /*@__PURE__*/continuedIndent()
            })
        ]
    }),
    languageData: {
        commentTokens: { block: { open: "/*", close: "*/" }, line: "//" },
        indentOnInput: /^\s*\}$/,
        wordChars: "$-"
    }
});
const indentedSassLanguage = /*@__PURE__*/sassLanguage.configure({
    dialect: "indented",
    props: [
        /*@__PURE__*/indentNodeProp.add({
            "Block RuleSet": cx => cx.baseIndent + cx.unit
        }),
        /*@__PURE__*/foldNodeProp.add({
            Block: node => ({ from: node.from, to: node.to })
        })
    ]
});
/**
Property, variable, $-variable, and value keyword completion
source.
*/
const sassCompletionSource = /*@__PURE__*/defineCSSCompletionSource(node => node.name == "VariableName" || node.name == "SassVariableName");
/**
Language support for CSS.
*/
function sass(config) {
    return new LanguageSupport((config === null || config === void 0 ? void 0 : config.indented) ? indentedSassLanguage : sassLanguage, sassLanguage.data.of({ autocomplete: sassCompletionSource }));
}

export { sass, sassCompletionSource, sassLanguage };
//# sourceMappingURL=index-DtRPRgAN.js.map
