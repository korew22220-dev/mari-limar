<?php
/**
 * Plugin Name: Марли Лимарт — визуальный редактор
 * Description: Редактирование текста и фотографий прямо в оформленных блоках сайта.
 * Version: 1.3.0
 */
defined('ABSPATH') || exit;
add_action('enqueue_block_editor_assets', function(){
 if(get_stylesheet() !== 'marli-limart') return;
 global $post;
 $head=$post?get_post_meta($post->ID,'_ml_head',true):'';
 preg_match_all('/<link\b[^>]*>|<style\b[^>]*>.*?<\/style>/is',$head,$matches);
 $styles='';
 foreach($matches[0] as $tag){if(stripos($tag,'stylesheet')!==false || stripos($tag,'<style')===0)$styles.=$tag;}
 $styles=function_exists('ml_urls')?ml_urls($styles):$styles;
 wp_dequeue_script('marli-editor');wp_deregister_script('marli-editor');
 wp_enqueue_script('marli-editor',plugins_url('visual-editor.js',__FILE__),['wp-blocks','wp-element','wp-block-editor','wp-components','wp-data'],'1.1.0',true);
 wp_add_inline_script('marli-editor','window.mlVisual='.wp_json_encode(['themeUrl'=>get_template_directory_uri(),'styles'=>$styles,'bodyClass'=>$post?get_post_meta($post->ID,'_ml_body_class',true):'']).';','before');
},100);
add_action('enqueue_block_assets',function(){if(is_admin())wp_enqueue_style('marli-visual-editor',plugins_url('editor.css',__FILE__),[],'1.1.0');});
add_action('admin_menu',function(){add_menu_page('Визуальный редактор','Редактор сайта','edit_pages','marli-visual','mlv_screen','dashicons-welcome-widgets-menus',21);});
add_action('admin_enqueue_scripts',function(){if(($_GET['page']??'')==='marli-visual')wp_enqueue_style('mlv-screen',plugins_url('editor.css',__FILE__),[],'1.3.0');});
add_action('load-post.php',function(){
 $id=absint($_GET['post']??0);
 if(($_GET['action']??'')==='edit'&&empty($_GET['ml_standard'])&&get_post_meta($id,'_ml_head',true)&&current_user_can('edit_post',$id)){
  wp_safe_redirect(admin_url('admin.php?page=marli-visual&post='.$id));exit;
 }
});
function mlv_screen(){
 $id=absint($_GET['post']??0);$post=get_post($id);
 if(!$post||!get_post_meta($id,'_ml_head',true)){
  echo '<div class="wrap"><h1>Визуальный редактор сайта</h1><p>Выберите страницу для редактирования.</p><ul>';
  foreach(get_option('ml_import_map',[]) as $pid){if(current_user_can('edit_post',$pid))echo '<li style="margin:12px 0"><a href="'.esc_url(admin_url('admin.php?page=marli-visual&post='.$pid)).'">'.esc_html(get_the_title($pid)).'</a></li>';}
  echo '</ul></div>';return;
 }
 if(!current_user_can('edit_post',$id))wp_die('Нет доступа');
 wp_enqueue_media();wp_enqueue_script('mlv-document',plugins_url('document-editor.js',__FILE__),[],'1.3.0',true);
 $blocks=parse_blocks($post->post_content);$html='';
 foreach($blocks as $i=>$block){$part=render_block($block);if($part==='')$part=$block['attrs']['html']??'';$html.='<div data-mlv-block="'.$i.'" style="display:contents">'.$part.'</div>';}
 $head=get_post_meta($id,'_ml_head',true);$head=preg_replace('/<script\b[^>]*>.*?<\/script>/is','',$head);
 $body=get_post_meta($id,'_ml_body_class',true);
 $preview='<!doctype html><html lang="ru"><head><meta charset="utf-8"><base href="'.esc_url(get_template_directory_uri()).'/">'.ml_urls($head).'<style>body{margin:0}*,*::before,*::after{animation:none!important;transition:none!important} [data-mlv-text]:hover{outline:1px dashed #4f94d4;outline-offset:5px;cursor:text}[data-mlv-text]:focus{outline:2px solid #2271b1;outline-offset:5px}img,video{cursor:pointer!important}img:hover,video:hover,[data-mlv-selected]{outline:3px solid #2271b1;outline-offset:-3px}form{pointer-events:none}.pm-curtain{display:none!important}.reveal,.pm-reveal,[data-reveal]{opacity:1!important;transform:none!important;visibility:visible!important}</style></head><body class="'.esc_attr($body).'">'.ml_urls(get_post_meta($id,'_ml_before',true)).(get_post_meta($id,'_ml_main_attrs',true)?:'<main>').$html.'</main>'.ml_urls(get_post_meta($id,'_ml_after',true)).'</body></html>';
 set_transient('mlv_preview_'.get_current_user_id().'_'.$id,$preview,600);
 $preview_url=html_entity_decode(wp_nonce_url(admin_url('admin-post.php?action=mlv_preview&post='.$id),'mlv_preview_'.$id),ENT_QUOTES,'UTF-8');
 wp_add_inline_script('mlv-document','window.mlvDocument='.wp_json_encode(['previewUrl'=>$preview_url,'blocks'=>array_map(function($b){return ['label'=>$b['attrs']['label']??($b['blockName']?'Текст статьи':''),'hidden'=>!empty($b['attrs']['hidden'])];},$blocks)]).';','before');
 echo '<div class="wrap mlv-page"><form method="post" action="'.esc_url(admin_url('admin-post.php')).'" id="mlv-form">';wp_nonce_field('mlv_save_'.$id);
 echo '<input type="hidden" name="action" value="mlv_save"><input type="hidden" name="post_id" value="'.$id.'"><input type="hidden" id="mlv-changes" name="changes"><input type="hidden" id="mlv-order" name="block_order"><div class="mlv-top"><div><h1>Редактирование страницы</h1><p>'.esc_html(get_the_title($id)).'</p></div><div><button type="button" class="button" id="mlv-mobile">Вид на телефоне</button> <button class="button button-primary" type="submit">Сохранить изменения</button> <a class="button" href="'.esc_url(get_permalink($id)).'" target="_blank">Открыть сайт ↗</a></div></div>';
 if(isset($_GET['saved']))echo '<div class="notice notice-success"><p>Изменения сохранены.</p></div>';
 echo '<div class="mlv-layout"><aside class="mlv-tools"><h2>Блоки страницы</h2><p>Нажмите на текст в макете, чтобы изменить его. Нажмите на фото для замены.</p><div id="mlv-list"></div><div id="mlv-media"></div><p id="mlv-status" role="status">Нет несохранённых изменений</p><a href="'.esc_url(admin_url('post.php?post='.$id.'&action=edit&ml_standard=1')).'">Стандартный редактор WordPress</a></aside><div class="mlv-canvas" id="mlv-canvas"><iframe id="mlv-preview" title="Визуальный редактор страницы" sandbox="allow-same-origin"></iframe></div></div></form></div>';
}
add_action('admin_post_mlv_save',function(){
 $id=absint($_POST['post_id']??0);if(!current_user_can('edit_post',$id))wp_die('Нет доступа');check_admin_referer('mlv_save_'.$id);
 $changes=json_decode(wp_unslash($_POST['changes']??'{}'),true);$order=json_decode(wp_unslash($_POST['block_order']??'[]'),true);$post=get_post($id);$blocks=parse_blocks($post->post_content);
 if(!is_array($changes)||!is_array($order)||count($order)!==count($blocks))wp_die('Не удалось проверить блоки страницы.');
 $sorted=$order;sort($sorted);if($sorted!==range(0,count($blocks)-1))wp_die('Неверный порядок блоков.');
 foreach($changes as $index=>$change){$i=absint($index);if(!isset($blocks[$i])||!is_array($change))continue;
  if(isset($change['html'])){$html=current_user_can('unfiltered_html')?$change['html']:wp_kses_post($change['html']);
   if($blocks[$i]['blockName']==='marli/section')$blocks[$i]['attrs']['html']=$html;
   else{$blocks[$i]['innerHTML']=$html;$blocks[$i]['innerContent']=[$html];}
  }
  if($blocks[$i]['blockName']==='marli/section'&&isset($change['hidden']))$blocks[$i]['attrs']['hidden']=(bool)$change['hidden'];
 }
 $new=[];foreach($order as $i)$new[]=$blocks[$i];
 $result=wp_update_post(wp_slash(['ID'=>$id,'post_content'=>serialize_blocks($new)]),true);if(is_wp_error($result))wp_die(esc_html($result->get_error_message()));
 wp_safe_redirect(admin_url('admin.php?page=marli-visual&post='.$id.'&saved=1'));exit;
});
add_action('admin_post_mlv_preview',function(){
 $id=absint($_GET['post']??0);if(!current_user_can('edit_post',$id))wp_die('Нет доступа');check_admin_referer('mlv_preview_'.$id);
 $html=get_transient('mlv_preview_'.get_current_user_id().'_'.$id);if(!$html)wp_die('Обновите страницу редактора.');
 nocache_headers();header('Content-Type: text/html; charset=utf-8');
 $html=preg_replace('/<script\b[^>]*>.*?<\/script>/is','',$html);
 $html=preg_replace('/<iframe\b[^>]*>.*?<\/iframe>/is','<div style="padding:35px;border:1px solid #555">Карта доступна на сайте</div>',$html);
 echo $html;exit;
});





