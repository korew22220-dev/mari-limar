<?php defined('ABSPATH') || exit; while(have_posts()):the_post();
$head=get_post_meta(get_the_ID(),'_ml_head',true);
if(!$head){$map=get_option('ml_import_map',[]);$head=get_post_meta($map['about']??0,'_ml_head',true);}
?><!DOCTYPE html><html lang="ru"><head><title><?php echo esc_html(get_the_title().' — Марли Лимарт');?></title><?php echo ml_urls($head);wp_head();?><style>body.admin-bar .head{top:32px}body{--ml-font:Stem,Arial,sans-serif}body.ml-font-custom,body.ml-font-custom p,body.ml-font-custom h1,body.ml-font-custom h2{font-family:var(--ml-font)!important}</style></head><body class="<?php echo esc_attr(get_post_meta(get_the_ID(),'_ml_body_class',true));?>"><?php wp_body_open();echo ml_urls(get_post_meta(get_the_ID(),'_ml_before',true)); echo get_post_meta(get_the_ID(),'_ml_main_attrs',true)?:'<main>';the_content();echo '</main>';echo ml_urls(get_post_meta(get_the_ID(),'_ml_after',true));wp_footer();?></body></html><?php endwhile;

