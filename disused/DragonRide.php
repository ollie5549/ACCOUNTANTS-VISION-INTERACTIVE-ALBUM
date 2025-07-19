<?php
/*
Template Name: Interactive Dragon Ride
*/
get_header(); // This pulls in the theme's <head> and opening <body> tag
?>

<div class="container">
    <h1>Move Your Mouse to Blend Colors!</h1>
    <div id="canvas-container">
        </div>
    <div class="info-box">
        <p>The background color changes based on your mouse position, blending between Red, Green, and Blue.</p>
        <p>The cone now points in the direction of your mouse cursor!</p>
    </div>
</div>

<tone-example label="Dragon Ride">
    <tone-loader></tone-loader>
    <tone-play-toggle></tone-play-toggle>
</tone-example>


<?php
// Your custom inline styles should ideally be in a separate .css file
// and enqueued in functions.php.
// If you must keep them here for a specific reason (though not recommended for long-term):
?>
<style>
    /* Styles for your interactive elements */
    body {
        /* Note: 'body' styles here might be overridden or combine with theme's body styles.
           It's generally better to apply styles to specific container elements. */
        /* display: flex;  might conflict with theme layout */
        /* justify-content: center; */
        /* align-items: center; */
        /* min-height: 100vh; */
        /* margin: 0; */
        background-color: #f0f0f0; /* This might be safe */
        overflow: hidden; /* This might be safe */
    }
    canvas {
        display: block;
        border-radius: 15px; /* Rounded corners for the canvas */
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); /* Subtle shadow */
        max-width: 90vw; /* Responsive width */
        max-height: 90vh; /* Responsive height */
    }
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        /* Consider adding margin-top/bottom to separate from other content/header/footer */
        margin-top: 20px;
        margin-bottom: 20px;
    }
    h1 {
        margin-bottom: 20px;
        color: #333;
        font-size: 2rem;
        text-align: center;
    }
    .info-box {
        background-color: #ffffff;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        margin-top: 20px;
        text-align: center;
        color: #555;
        font-size: 0.9rem;
    }

    /* Styles specifically for the tone-example custom element if needed */
    tone-example {
        display: block; /* Custom elements often need display property defined */
        margin-top: 30px; /* Add some spacing */
        text-align: center; /* Center its contents if appropriate */
        /* Add any other specific styling for your tone-example component */
    }
</style>

<?php
get_footer(); // This pulls in the closing </body> and </html> tags
?>