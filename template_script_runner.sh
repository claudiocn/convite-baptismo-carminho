mkdir -p templates/01-drawing-nature/sass templates/01-drawing-nature/images

cat <<EOF > templates/01-drawing-nature/index.ejs
<%- include('../../core/html/head', { 
    title: data.title, 
    themeColor: data.themeColor, 
    description: data.description, 
    baseUrl: data.baseUrl, 
    cssFiles: ['style.css'] 
}) %>

<div class="invitation-card" id="main-card">
    <div class="floral-frame top"></div>
    <div class="floral-frame bottom"></div>
    
    <main class="content">
        <div class="header-section">
            <span class="join-us">join us for the</span>
            <div class="cross">†</div>
            <h1 class="event-type"><%= data.tipoEvento.toUpperCase() %></h1>
            <p class="sub-text">of our daughter</p>
        </div>

        <h2 class="main-name"><%- data.nomeCrianca %></h2>

        <div class="date-box">
            <div class="date-row">
                <span class="month">JUN</span>
                <span class="day">27</span>
                <span class="weekday">SUN</span>
            </div>
            <p class="time">at eleven o'clock</p>
        </div>

        <section class="details-section">
            <div class="location-item" onclick="toggleDetails('cerimonia', this)">
                <h3><%= data.cerimonia.nome %></h3>
                <div id="cerimonia" class="hidden-details">
                    <p><%= data.cerimonia.morada %></p>
                    <a href="<%= data.cerimonia.linkMapa %>" target="_blank" class="map-btn">Ver no Mapa</a>
                </div>
            </div>

            <% if (data.rececao) { %>
            <div class="location-item" onclick="toggleDetails('rececao', this)">
                <h3><%= data.rececao.nome %></h3>
                <div id="rececao" class="hidden-details">
                    <p><%= data.rececao.morada %></p>
                    <a href="<%= data.rececao.linkMapa %>" target="_blank" class="map-btn">Ver no Mapa</a>
                </div>
            </div>
            <% } %>
        </section>

        <footer class="rsvp-section">
            <p class="rsvp-title">kindly rsvp to</p>
            <% data.contactos.forEach(function(contato) { %>
                <a href="<%= contato.link %>" class="contact-link"><%= contato.nome %></a>
            <% }); %>
        </footer >
    </main>
</div>

<%- include('../../core/html/foot') %>
EOF

cat <<EOF > templates/01-drawing-nature/thumbnail.ejs
<%- include('../../core/html/head', { 
    title: data.title, 
    themeColor: data.themeColor, 
    description: data.description, 
    baseUrl: data.baseUrl, 
    cssFiles: ['style.css', 'thumbnail.css'] 
}) %>

<div class="invitation-thumbnail" id="main-card">
    <div class="floral-frame top-left"></div>
    <div class="floral-frame bottom-right"></div>
    
    <div class="thumb-content">
        <div class="left-col">
            <div class="cross">†</div>
            <h1 class="event-type"><%= data.tipoEvento %></h1>
            <h2 class="main-name"><%- data.nomeCrianca.replace(/<br\s*\/?>/gi, ' ') %></h2>
        </div>
        <div class="right-col">
            <div class="date-box">
                <span class="day">27</span>
                <span class="month-year">JUN | SUN</span>
            </div>
            <p class="location-summary"><%= data.cerimonia.nome %></p>
        </div>
    </div>
</div>

<%- include('../../core/html/foot') %>
EOF

cat <<EOF > templates/01-drawing-nature/sass/_variables.scss
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Pinyon+Script&display=swap');

\$font-serif: 'Playfair Display', serif;
\$font-script: 'Pinyon Script', cursive;
\$font-sans: 'Montserrat', sans-serif;

\$base-blue: #5d7fa3; // Azul acinzentado inspirado na imagem
\$bg-white: #fdfdfd;
EOF

cat <<EOF > templates/01-drawing-nature/sass/style.scss
@use "system";
@use "variables" as *;

body {
    background-color: #eee;
    display: flex;
    justify-content: center;
    font-family: \$font-sans;
}

.invitation-card {
    background-color: \$bg-white;
    max-width: 480px;
    width: 100%;
    height: 100dvh;
    position: relative;
    overflow: hidden;
    color: \$themeColor;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    box-sizing: border-box;
    text-align: center;
}

.floral-frame {
    position: absolute;
    width: 100%;
    height: 150px;
    background-size: contain;
    background-repeat: no-repeat;
    pointer-events: none;
    opacity: 0.8;
    
    &.top { 
        top: 0; 
        background-image: url('../images/floral-top.png'); 
        background-position: top center;
    }
    &.bottom { 
        bottom: 0; 
        background-image: url('../images/floral-bottom.png'); 
        background-position: bottom center;
    }
}

.header-section {
    margin-top: 40px;
    .join-us { font-style: italic; font-size: 0.9rem; margin-bottom: 10px; display: block; }
    .cross { font-size: 1.5rem; margin-bottom: 15px; }
    .event-type { 
        font-family: \$font-serif; 
        letter-spacing: 6px; 
        font-weight: 400;
        margin: 10px 0;
    }
}

.main-name {
    font-family: \$font-script;
    font-size: 2.8rem;
    margin: 20px 0;
    font-weight: 400;
}

.date-box {
    border-top: 1px solid \$themeColor;
    border-bottom: 1px solid \$themeColor;
    padding: 15px 0;
    margin: 20px 0;
    width: 80%;

    .date-row {
        display: flex;
        justify-content: center;
        gap: 20px;
        font-family: \$font-serif;
        font-size: 1.2rem;
        align-items: center;
        
        .day { font-size: 1.8rem; font-weight: bold; border-left: 1px solid \$themeColor; border-right: 1px solid \$themeColor; padding: 0 15px; }
    }
    .time { font-style: italic; margin-top: 10px; font-size: 0.9rem; }
}

.details-section {
    width: 90%;
    margin-top: 20px;

    .location-item {
        margin-bottom: 15px;
        cursor: pointer;
        h3 { font-family: \$font-serif; text-transform: uppercase; font-size: 1rem; margin-bottom: 5px; }
    }
}

.hidden-details {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: all 0.4s ease;
    font-size: 0.85rem;
    
    &.open {
        max-height: 200px;
        opacity: 1;
        padding-top: 10px;
    }

    .map-btn {
        display: inline-block;
        margin-top: 10px;
        padding: 5px 15px;
        border: 1px solid \$themeColor;
        text-decoration: none;
        color: inherit;
        font-size: 0.7rem;
        text-transform: uppercase;
    }
}

.rsvp-section {
    margin-top: auto;
    padding-bottom: 40px;
    .rsvp-title { font-style: italic; font-size: 0.9rem; margin-bottom: 5px; }
    .contact-link { 
        display: block; 
        text-decoration: none; 
        color: inherit; 
        font-weight: bold;
        letter-spacing: 1px;
    }
}
EOF

cat <<EOF > templates/01-drawing-nature/sass/thumbnail.scss
@use "variables" as *;

.invitation-thumbnail {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 100px;
    background-color: \$bg-white;
    color: \$themeColor;

    .floral-frame {
        width: 400px;
        height: 400px;
        &.top-left { top: 0; left: 0; background-image: url('../images/floral-top.png'); transform: rotate(0deg); }
        &.bottom-right { bottom: 0; right: 0; background-image: url('../images/floral-bottom.png'); transform: rotate(180deg); }
    }

    .thumb-content {
        display: flex;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        z-index: 2;
    }

    .left-col {
        text-align: left;
        .event-type { font-size: 3rem; margin: 0; }
        .main-name { font-size: 4rem; margin: 0; }
    }

    .right-col {
        text-align: right;
        .date-box {
            width: auto;
            border: none;
            border-left: 2px solid \$themeColor;
            padding-left: 20px;
            .day { border: none; padding: 0; font-size: 4rem; }
            .month-year { display: block; font-family: \$font-serif; font-size: 1.5rem; }
        }
    }
}
EOF