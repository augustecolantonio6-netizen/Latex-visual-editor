import type { BlockDef, CategoryDef } from "./types";

export const CATEGORIES: CategoryDef[] = [
  { id: "operators", label: "Opérateurs", icon: "sigma" },
  { id: "relations", label: "Relations & flèches", icon: "arrows" },
  { id: "greek", label: "Lettres grecques", icon: "omega" },
  { id: "sets", label: "Ensembles & logique", icon: "sets" },
  { id: "delims", label: "Délimiteurs & accents", icon: "delims" },
  { id: "functions", label: "Fonctions", icon: "fn" },
];

const B: BlockDef[] = [];

const sym = (type: string, label: string, latex: string, category: string, keywords = "") =>
  B.push({ type, label, latex, category, kind: "symbol", preview: latex, keywords });

const struct = (
  type: string,
  label: string,
  category: string,
  preview: string,
  slots: { name: string; label?: string }[],
  keywords = "",
) => B.push({ type, label, category, kind: "structure", preview, slots, keywords });

/* ---------------- Opérateurs (structures) ---------------- */
struct("sum", "Somme", "operators", "\\sum_{i=1}^{n}", [
  { name: "upper", label: "borne haute" },
  { name: "lower", label: "borne basse" },
  { name: "body", label: "terme" },
], "somme sigma sum");
struct("prod", "Produit", "operators", "\\prod_{i=1}^{n}", [
  { name: "upper" },
  { name: "lower" },
  { name: "body" },
], "produit pi prod");
struct("frac", "Fraction", "operators", "\\frac{a}{b}", [
  { name: "num", label: "numérateur" },
  { name: "den", label: "dénominateur" },
], "fraction division");
struct("sqrt", "Racine", "operators", "\\sqrt{x}", [{ name: "body" }], "racine carre sqrt");
struct("root", "Racine n-ième", "operators", "\\sqrt[n]{x}", [
  { name: "index" },
  { name: "body" },
], "racine nieme root");
struct("power", "Puissance", "operators", "x^{n}", [
  { name: "base" },
  { name: "exp" },
], "puissance exposant");
struct("sub", "Indice", "operators", "x_{n}", [
  { name: "base" },
  { name: "sub" },
], "indice subscript");
struct("integral", "Intégrale", "operators", "\\int_{a}^{b}", [
  { name: "upper" },
  { name: "lower" },
  { name: "body" },
], "integrale integral");
struct("oint", "Intégrale close", "operators", "\\oint_{C}", [
  { name: "upper" },
  { name: "lower" },
  { name: "body" },
], "integrale contour");
struct("lim", "Limite", "operators", "\\lim_{x \\to 0}", [
  { name: "under" },
  { name: "body" },
], "limite limit");
struct("binom", "Coefficient", "operators", "\\binom{n}{k}", [
  { name: "top" },
  { name: "bottom" },
], "binome coefficient combinaison");
struct("matrix", "Matrice 2×2", "operators", "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", [
  { name: "a" },
  { name: "b" },
  { name: "c" },
  { name: "d" },
], "matrice matrix");
B.push({
  type: "text",
  label: "Texte libre",
  category: "operators",
  kind: "text",
  preview: "abc",
  defaultText: "x",
  keywords: "texte variable lettre",
});

/* ---------------- Relations & flèches ---------------- */
sym("eq", "Égal", "=", "relations", "egal");
sym("neq", "Différent", "\\neq", "relations", "different");
sym("approx", "Environ", "\\approx", "relations");
sym("equiv", "Équivalent", "\\equiv", "relations", "equivalent congru");
sym("lt", "Inférieur", "<", "relations");
sym("gt", "Supérieur", ">", "relations");
sym("leq", "Inf. ou égal", "\\leq", "relations");
sym("geq", "Sup. ou égal", "\\geq", "relations");
sym("pm", "Plus-moins", "\\pm", "relations");
sym("times", "Fois", "\\times", "relations", "multiplication");
sym("div", "Divisé", "\\div", "relations", "division");
sym("cdot", "Point médian", "\\cdot", "relations", "produit point");
sym("propto", "Proportionnel", "\\propto", "relations");
sym("sim", "Similaire", "\\sim", "relations");
sym("ll", "Très inférieur", "\\ll", "relations");
sym("gg", "Très supérieur", "\\gg", "relations");
sym("to", "Vers", "\\to", "relations", "fleche");
sym("leftarrow", "Flèche gauche", "\\leftarrow", "relations", "fleche");
sym("Rightarrow", "Implique", "\\Rightarrow", "relations", "fleche implique");
sym("Leftarrow", "Flèche g. double", "\\Leftarrow", "relations", "fleche");
sym("leftrightarrow", "Double flèche", "\\leftrightarrow", "relations", "fleche");
sym("Leftrightarrow", "Équivaut", "\\Leftrightarrow", "relations", "fleche ssi");
sym("mapsto", "Mapsto", "\\mapsto", "relations", "fleche application");
sym("uparrow", "Flèche haut", "\\uparrow", "relations", "fleche");
sym("downarrow", "Flèche bas", "\\downarrow", "relations", "fleche");

/* ---------------- Lettres grecques ---------------- */
const greekLower: [string, string][] = [
  ["alpha", "alpha"], ["beta", "beta"], ["gamma", "gamma"], ["delta", "delta"],
  ["epsilon", "epsilon"], ["zeta", "zeta"], ["eta", "eta"], ["theta", "theta"],
  ["iota", "iota"], ["kappa", "kappa"], ["lambda", "lambda"], ["mu", "mu"],
  ["nu", "nu"], ["xi", "xi"], ["pi", "pi"], ["rho", "rho"],
  ["sigma", "sigma"], ["tau", "tau"], ["upsilon", "upsilon"], ["phi", "phi"],
  ["chi", "chi"], ["psi", "psi"], ["omega", "omega"],
];
greekLower.forEach(([t, l]) => sym(t, l[0].toUpperCase() + l.slice(1), "\\" + l, "greek"));

const greekUpper: [string, string][] = [
  ["Gamma", "Gamma"], ["Delta", "Delta"], ["Theta", "Theta"], ["Lambda", "Lambda"],
  ["Xi", "Xi"], ["Pi", "Pi"], ["Sigma", "Sigma"], ["Upsilon", "Upsilon"],
  ["Phi", "Phi"], ["Psi", "Psi"], ["Omega", "Omega"],
];
greekUpper.forEach(([t, l]) => sym("u" + t, l, "\\" + l, "greek", "majuscule"));

/* ---------------- Ensembles & logique ---------------- */
sym("in", "Appartient", "\\in", "sets", "appartient");
sym("notin", "N'appartient pas", "\\notin", "sets");
sym("ni", "Contient", "\\ni", "sets");
sym("subset", "Sous-ensemble", "\\subset", "sets", "inclus");
sym("subseteq", "Sous-ens. large", "\\subseteq", "sets");
sym("supset", "Sur-ensemble", "\\supset", "sets");
sym("supseteq", "Sur-ens. large", "\\supseteq", "sets");
sym("cup", "Union", "\\cup", "sets");
sym("cap", "Intersection", "\\cap", "sets");
sym("setminus", "Différence", "\\setminus", "sets");
sym("emptyset", "Ensemble vide", "\\varnothing", "sets", "vide");
sym("forall", "Pour tout", "\\forall", "sets", "quantificateur");
sym("exists", "Il existe", "\\exists", "sets", "quantificateur");
sym("nexists", "N'existe pas", "\\nexists", "sets");
sym("land", "Et", "\\land", "sets", "logique conjonction");
sym("lor", "Ou", "\\lor", "sets", "logique disjonction");
sym("lnot", "Non", "\\lnot", "sets", "logique negation");
sym("infty", "Infini", "\\infty", "sets");
sym("N", "Entiers ℕ", "\\mathbb{N}", "sets", "entiers naturels");
sym("Z", "Relatifs ℤ", "\\mathbb{Z}", "sets", "entiers relatifs");
sym("Q", "Rationnels ℚ", "\\mathbb{Q}", "sets");
sym("R", "Réels ℝ", "\\mathbb{R}", "sets", "reels");
sym("C", "Complexes ℂ", "\\mathbb{C}", "sets");
sym("partial", "Partielle", "\\partial", "sets", "derivee partielle");
sym("nabla", "Nabla", "\\nabla", "sets", "gradient");

/* ---------------- Délimiteurs & accents ---------------- */
struct("paren", "Parenthèses", "delims", "\\left( x \\right)", [{ name: "body" }], "parenthese");
struct("bracket", "Crochets", "delims", "\\left[ x \\right]", [{ name: "body" }], "crochet");
struct("brace", "Accolades", "delims", "\\left\\{ x \\right\\}", [{ name: "body" }], "accolade");
struct("abs", "Valeur absolue", "delims", "\\left| x \\right|", [{ name: "body" }], "valeur absolue");
struct("norm", "Norme", "delims", "\\left\\| x \\right\\|", [{ name: "body" }], "norme");
struct("ceil", "Plafond", "delims", "\\left\\lceil x \\right\\rceil", [{ name: "body" }], "plafond");
struct("floor", "Plancher", "delims", "\\left\\lfloor x \\right\\rfloor", [{ name: "body" }], "plancher partie entiere");
struct("angle", "Chevrons", "delims", "\\left\\langle x \\right\\rangle", [{ name: "body" }], "chevron angle");
struct("hat", "Chapeau", "delims", "\\hat{x}", [{ name: "body" }], "chapeau accent");
struct("bar", "Barre", "delims", "\\bar{x}", [{ name: "body" }], "barre accent moyenne");
struct("vec", "Vecteur", "delims", "\\vec{x}", [{ name: "body" }], "vecteur fleche");
struct("dot", "Point", "delims", "\\dot{x}", [{ name: "body" }], "point derivee");
struct("tilde", "Tilde", "delims", "\\tilde{x}", [{ name: "body" }], "tilde accent");
struct("overline", "Surligné", "delims", "\\overline{xy}", [{ name: "body" }], "surligne");
struct("underline", "Souligné", "delims", "\\underline{xy}", [{ name: "body" }], "souligne");

/* ---------------- Fonctions ---------------- */
["sin", "cos", "tan", "cot", "ln", "log", "exp", "det", "max", "min"].forEach((f) =>
  sym("fn_" + f, f, "\\" + f, "functions", "fonction"),
);

export const BLOCKS: BlockDef[] = B;

export const DEFS: Record<string, BlockDef> = Object.fromEntries(B.map((b) => [b.type, b]));

export const CATEGORY_COUNT = (id: string) => B.filter((b) => b.category === id).length;
