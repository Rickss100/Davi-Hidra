const fs = require('fs');

let css = fs.readFileSync('src/pages/OndeAportar.css', 'utf8');

css = css.replace(/\.input-wrapper \{[\s\S]*?\}/, `.input-wrapper {
  display: flex;
  align-items: center;
  background: #202024;
  border: 1px solid #29292e;
  border-radius: 4px;
  padding-left: 1rem;
}
.input-wrapper:focus-within {
  border-color: #04d361;
}`);

css = css.replace(/\.currency \{[\s\S]*?\}/, `.currency {
  color: #737380;
  font-weight: 600;
  margin-right: 0.5rem;
}`);

css = css.replace(/\.input-wrapper input \{[\s\S]*?\}/, `.input-wrapper input {
  background: transparent;
  border: none;
  color: #e1e1e6;
  padding: 0.75rem 1rem 0.75rem 0;
  font-size: 1rem;
  width: 100%;
  outline: none;
}`);

css = css.replace(/\.input-wrapper input:focus \{[\s\S]*?\}/, ``);

fs.writeFileSync('src/pages/OndeAportar.css', css);
console.log('Fixed CSS robustly');
