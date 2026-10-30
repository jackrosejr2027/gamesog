(() => {
 const names={felt:'Green Felt',walnut:'Walnut Room',midnight:'Midnight Lounge',synthwave:'Synthwave Arcade',paper:'Paper Studio',ocean:'Ocean Drift',ember:'Ember Forge',cosmos:'Cosmic Cabinet',frost:'Frosted Glass',deco:'Art Deco',aurora:'Aurora Night',volcano:'Volcanic Glass',rose:'Rose Quartz',desert:'Desert Mirage',rain:'Rainy Window',candy:'Candy Circuit',forest:'Firefly Forest',copper:'Copperworks',lagoon:'Moonlit Lagoon',prism:'Prism Studio',velvet:'Velvet Theatre'};
 let value='felt';if(!window.DemoSession)try{const saved=localStorage.getItem('arcade_page_theme');if(names[saved])value=saved}catch(e){}
 function apply(theme){if(!names[theme])return;value=theme;document.documentElement.dataset.pageTheme=theme;for(const el of document.querySelectorAll('[data-theme-select]'))el.value=theme;if(!window.DemoSession)try{localStorage.setItem('arcade_page_theme',theme)}catch(e){}}
 function control(){const label=h('label','page-theme-control'),select=h('select');select.dataset.themeSelect='true';select.setAttribute('aria-label','Page style');for(const [key,name]of Object.entries(names)){const option=h('option','',name);option.value=key;select.appendChild(option)}select.value=value;select.onchange=()=>apply(select.value);label.appendChild(select);return label}
 document.documentElement.dataset.pageTheme=value;
 $('#top').appendChild(control());$('#g2t').querySelector('span').prepend(control());$('#mtop').appendChild(control());
 window.ArcadeThemes={control,apply,names,get value(){return value}};
})();
