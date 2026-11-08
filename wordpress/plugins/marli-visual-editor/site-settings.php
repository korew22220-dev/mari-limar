<?php
defined('ABSPATH')||exit;
function mlv_contact_fields(){return [
 'phone'=>['Основной телефон','8 800 201-77-67','text'], 'phone_dial'=>['Основной телефон для звонка','+78002017767','text'],
 'mobile'=>['Мобильный телефон','+7 (918) 402-99-32','text'],'mobile_dial'=>['Мобильный для звонка','+79184029932','text'],
 'address'=>['Адрес шоурума','Виноградная улица, 2/3Б','text'],'address_short'=>['Короткий адрес','Сочи, Виноградная, 2/3Б','text'],
 'entry'=>['Как найти вход','1 этаж · вход со стороны ул. Красноармейская','text'],
 'whatsapp'=>['Ссылка WhatsApp','https://wa.me/79184029932','url'],'telegram'=>['Ссылка Telegram','https://t.me/+79184029932','url'],
 'max'=>['Ссылка MAX','https://web.max.ru/','url'],'map'=>['Открыть карту','https://2gis.ru/sochi/firm/70000001079104222','url'],
 'embed'=>['Адрес встроенной карты','https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A43.596031%2C%22lon%22%3A39.718524%2C%22zoom%22%3A17%7D%2C%22opt%22%3A%7B%22city%22%3A%22sochi%22%7D%2C%22org%22%3A%2270000001079104222%22%7D','url']];}
add_action('admin_menu',function(){add_submenu_page('marli-visual','Общие контакты','Общие контакты','manage_options','marli-contacts','mlv_contacts_screen');},20);
function mlv_contacts_screen(){
 if(!current_user_can('manage_options'))return;$values=get_option('mlv_contacts',[]);
 echo '<div class="wrap"><h1>Общие контакты сайта</h1><p>Эти данные используются на всех страницах: в контактах, меню, подвале и кнопках связи.</p>';
 if(isset($_GET['saved']))echo '<div class="notice notice-success"><p>Контакты сохранены.</p></div>';
 echo '<form method="post" action="'.esc_url(admin_url('admin-post.php')).'">';wp_nonce_field('mlv_contacts');echo '<input type="hidden" name="action" value="mlv_contacts"><table class="form-table">';
 foreach(mlv_contact_fields() as $key=>$field)echo '<tr><th><label for="mlv-contact-'.esc_attr($key).'">'.esc_html($field[0]).'</label></th><td><input class="regular-text" id="mlv-contact-'.esc_attr($key).'" name="contacts['.esc_attr($key).']" type="'.esc_attr($field[2]).'" value="'.esc_attr($values[$key]??$field[1]).'"></td></tr>';
 echo '</table><button class="button button-primary">Сохранить контакты на всём сайте</button> <a class="button" href="'.esc_url(admin_url('admin.php?page=marli-visual')).'">Все страницы</a></form></div>';
}
add_action('admin_post_mlv_contacts',function(){
 if(!current_user_can('manage_options'))wp_die('Нет доступа');check_admin_referer('mlv_contacts');$raw=wp_unslash($_POST['contacts']??[]);$values=[];
 foreach(mlv_contact_fields() as $key=>$f){$value=trim((string)($raw[$key]??''));$values[$key]=$f[2]==='url'?esc_url_raw($value,['http','https']):sanitize_text_field($value);}
 foreach(['phone_dial','mobile_dial'] as $key)if(!preg_match('/^\+?[0-9 ()-]{7,30}$/',$values[$key]))wp_die('Проверьте номер телефона для звонка.');
 update_option('mlv_contacts',$values);wp_safe_redirect(admin_url('admin.php?page=marli-contacts&saved=1'));exit;
});
function mlv_shared_html($html){
 $values=get_option('mlv_contacts',[]);if(!$values)return $html;$replace=[];
 foreach(mlv_contact_fields() as $key=>$f){$new=$values[$key]??$f[1];$replace[esc_html($f[1])]=esc_html($new);$replace[esc_attr($f[1])]=esc_attr($new);}
 $replace['1 этаж · вход с ул. Красноармейская']=esc_html($values['entry']);
 $replace['79184029932']=preg_replace('/\D/','',$values['mobile_dial']);
 return strtr($html,$replace);
}
add_action('template_redirect',function(){
 if(isset($_GET['mlv_contact_script'])){
  header('Content-Type: application/javascript; charset=utf-8');header('Cache-Control: no-cache');
  $js=file_get_contents(get_template_directory().'/assets/contact-tools.js');$v=get_option('mlv_contacts',[]);
  if($v){$js=str_replace("var phone='79184029932';",'var phone='.wp_json_encode(preg_replace('/\D/','',$v['mobile_dial'])).';',$js);
   $js=str_replace("'https://wa.me/'+phone+'?text='",wp_json_encode($v['whatsapp'])."+('".(strpos($v['whatsapp'],'?')===false?'?':'&')."text=')",$js);
   $js=str_replace("'https://t.me/+'+phone",wp_json_encode($v['telegram']),$js);$js=str_replace("'https://web.max.ru/'",wp_json_encode($v['max']),$js);
  }echo $js;exit;
 }
 if(!is_admin()&&get_stylesheet()==='marli-limart'&&get_option('mlv_contacts'))ob_start(function($html){$html=mlv_shared_html($html);return preg_replace('~src=(["\x27])[^"\x27]*assets/contact-tools\.js[^"\x27]*\1~','src="'.esc_url(home_url('/?mlv_contact_script=1')).'"',$html);});
},0);


