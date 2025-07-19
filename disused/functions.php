<?php
// Enqueue parent theme style - ALWAYS include this in your child theme's functions.php
function photography_gridly_child_enqueue_parent_styles() {
    wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
}
add_action( 'wp_enqueue_scripts', 'photography_gridly_child_enqueue_parent_styles' );

// Enqueue your custom CSS files for the interactive element.
function photography_gridly_child_enqueue_custom_styles() {
    wp_enqueue_style( 'my-custom-fonts', get_stylesheet_directory_uri() . '/css/AVfonts.css' );
    wp_enqueue_style( 'interactive-element-styles', get_stylesheet_directory_uri() . '/css/interactive-element-styles.css' ); // Create this file and put your custom <style> rules here.
}
add_action( 'wp_enqueue_scripts', 'photography_gridly_child_enqueue_custom_styles' );


// Enqueue your custom JavaScript files for the interactive element.
function photography_gridly_child_enqueue_custom_scripts() {
    wp_enqueue_script( 'webcomponents-bundle', get_stylesheet_directory_uri() . '/js/webcomponents-bundle.js', array(), null, true );
    wp_enqueue_script( 'tone-js', get_stylesheet_directory_uri() . '/js/Tone.js', array(), null, true );
    wp_enqueue_script( 'tone-ui', get_stylesheet_directory_uri() . '/js/tone-ui.js', array('tone-js'), null, true );
    wp_enqueue_script( 'components-js', get_stylesheet_directory_uri() . '/js/components.js', array('tone-ui'), null, true );
    wp_enqueue_script( 'p5-js', get_stylesheet_directory_uri() . '/js/p5.js', array(), null, true );
    wp_enqueue_script( 'dragon-ride-script', get_stylesheet_directory_uri() . '/AVscript/DragonRide.js', array('tone-js', 'p5-js'), null, true );

    // Pass the audio directory path to your JavaScript
    wp_localize_script( 'dragon-ride-script', 'themeAudio', array(
        'audioPath' => get_stylesheet_directory_uri() . '/audio/COLOURS/'
    ));
}
add_action( 'wp_enqueue_scripts', 'photography_gridly_child_enqueue_custom_scripts' );
?>