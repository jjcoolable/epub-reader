    // Client-side JavaScript for rendering EPUB books using epubjs
window.onload = function() {
    // Code to initialize epubjs and render EPUB books 
    // Create a book object from the EPUB file
    const book = ePub("/uploads/<%= book.file_name %>");

    // Render the book to the specified element with a given size
    const rendition = book.renderTo("viewer", { width: "100%", height: "100%" });

    // Display the initial page
    rendition.display();

    // Handle resizing of the viewport
    window.addEventListener("resize", () => {
      rendition.resize();
    });

    // Go to the specified location in the book (e.g., when clicking on a TOC item)
    const goTo = (href) => {
      rendition.display(href);
    };

    // Bind the goTo function to all links in the TOC
    const tocLinks = document.querySelectorAll("#toc a");
    tocLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        goTo(link.getAttribute("href"));
      });
    });

    // Handle key presses for navigation (left and right arrow keys)
    document.addEventListener("keydown", (e) => {
      if (e.keyCode === 37) { // Left arrow
        rendition.prev();
      } else if (e.keyCode === 39) { // Right arrow
        rendition.next();
      }
    });
  };
  
    
    
   