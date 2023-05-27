
let add_new_rule_buttons;

let add_new_button_last = document.getElementById('id_add_new_rule_last');
let rules_ids_count = document.getElementById('rules_ids_count');

let rules_container = document.getElementById('rules_group');


console.log('rules_ids_count', rules_ids_count);

if (rules_ids_count == null) rules_ids_count = 0;

define('init_rule_buttons', function(url) {
    add_new_button_last.addEventListener('click', e => {
        // let rule = document.createElement('input');
        // rule.setAttribute('type', 'text');
        // rule.setAttribute('class', 'form-control');
        
        // rules_container.appendChild(rule);
        
        let new_url = url + "&addrule"

    });
});



