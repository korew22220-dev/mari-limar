<?php
defined('ABSPATH') || exit;
add_action('after_setup_theme', function(){add_theme_support('post-thumbnails');add_theme_support('editor-styles');});
add_action('init', function(){
 foreach(['ml_kitchen'=>'Кухни','ml_wardrobe'=>'Гардеробные','ml_project'=>'Проекты'] as $type=>$label){
  register_post_type($type,['label'=>$label,'public'=>true,'show_in_rest'=>true,'supports'=>['title','editor','thumbnail','excerpt','custom-fields'],'rewrite'=>false,'menu_icon'=>'dashicons-layout']);
 }
 register_block_type('marli/section',['api_version'=>3,'editor_script'=>'marli-editor','attributes'=>['html'=>['type'=>'string','default'=>''],'label'=>['type'=>'string','default'=>'Блок страницы'],'hidden'=>['type'=>'boolean','default'=>false]],'render_callback'=>function($a){return empty($a['hidden'])?ml_urls($a['html']??''):'';}]);
});
add_action('enqueue_block_editor_assets',function(){wp_enqueue_script('marli-editor',get_template_directory_uri().'/editor.js',['wp-blocks','wp-element','wp-block-editor','wp-components'],'0.1',true);wp_add_inline_script('marli-editor','window.mlThemeUrl='.wp_json_encode(get_template_directory_uri()).';','before');});
function ml_urls($html){
 $base=esc_url(get_template_directory_uri());
 $html=str_replace(['https://korew22220-dev.github.io/mari-limar/assets/','"assets/',"'assets/"],[$base.'/assets/','"'.$base.'/assets/',"'".$base.'/assets/'],$html);
 $html=preg_replace('/(?<=\s)assets\//',$base.'/assets/',$html);
 $html=preg_replace_callback('/\b(href|action)=(\x22|\x27)([a-z0-9-]+)\.html([#?][^\x22\x27]*)?\2/i',function($m){$map=get_option('ml_import_map',[]);$id=$map[$m[3]]??0;$url=$id?get_permalink($id):home_url('/'.$m[3].'/');return $m[1].'='.$m[2].esc_url($url.($m[4]??'')).$m[2];},$html);
 return $html;
}
add_filter('the_content','ml_urls',30);
add_action('admin_menu',function(){add_theme_page('Перенос Марли Лимарт','Перенос сайта','manage_options','marli-import',function(){
 echo '<div class="wrap"><h1>Перенос Марли Лимарт</h1><p>Импорт 61 страницы из wordpress-staging. Повторный запуск добавляет только отсутствующие страницы.</p><form method="post" action="'.esc_url(admin_url('admin-post.php')).'">';wp_nonce_field('ml_import');echo '<input type="hidden" name="action" value="ml_import"><button class="button button-primary">Импортировать сайт</button></form></div>';
});});
add_action('admin_post_ml_import',function(){
 if(!current_user_can('manage_options'))wp_die('Нет доступа');check_admin_referer('ml_import');
 $data=json_decode(file_get_contents(get_template_directory().'/import.json'),true);$map=get_option('ml_import_map',[]);
 foreach($data as $p){if(!empty($map[$p['slug']])&&get_post($map[$p['slug']]))continue;
 $id=wp_insert_post(wp_slash(['post_type'=>$p['type'],'post_title'=>$p['title'],'post_name'=>$p['slug'],'post_content'=>$p['content'],'post_status'=>'publish']),true);
 if(is_wp_error($id))wp_die(esc_html($id->get_error_message()));
 foreach(['head','body_class','before','after','main_attrs'] as $key)update_post_meta($id,'_ml_'.$key,wp_slash($p[$key]));
 $map[$p['slug']]=$id;
 }
 update_option('ml_import_map',$map);update_option('show_on_front','page');update_option('page_on_front',$map['index']);update_option('blogname','Марли Лимарт');update_option('blogdescription','Архитектура. Интерьеры. Мебель.');update_option('blog_public','0');
 wp_safe_redirect(admin_url('edit.php?post_type=page'));exit;
});
add_action('template_redirect',function(){
 $path=trim(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH),'/');if(preg_match('/^([a-z0-9-]+)\.html$/',$path,$m)){$map=get_option('ml_import_map',[]);if(isset($map[$m[1]])){wp_safe_redirect(get_permalink($map[$m[1]]),301);exit;}}
});
add_action('wp_footer',function(){
 if(get_option('blog_public')!=='0')return;
 echo '<script>document.querySelectorAll("form").forEach(function(f){f.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();alert("Тестовый сайт: заявки пока не отправляются.");},true);});</script>';
},999);
add_action('customize_register',function($c){
 $c->add_section('ml_fonts',['title'=>'Шрифты Марли Лимарт']);
 $c->add_setting('ml_font',['default'=>'original','sanitize_callback'=>function($v){return in_array($v,['original','Arial','Georgia','Verdana'],true)?$v:'original';}]);
 $c->add_control('ml_font',['label'=>'Основной шрифт','section'=>'ml_fonts','type'=>'select','choices'=>['original'=>'Исходные шрифты сайта','Arial'=>'Arial','Georgia'=>'Georgia','Verdana'=>'Verdana']]);
});
add_action('wp_head',function(){ $font=get_theme_mod('ml_font','original');if($font!=='original')echo '<style>html body,html body p,html body h1,html body h2,html body h3,html body a,html body button{font-family:'.esc_html($font).'!important}</style>';});

