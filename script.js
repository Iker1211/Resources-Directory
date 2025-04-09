document.addEventListener("DOMContentLoaded", () => {
    const accordionMenus = document.querySelectorAll(".gsap-accordion-menu");
  
    accordionMenus.forEach(menu => {
      menu.addEventListener("click", () => {
        const content = menu.nextElementSibling;
  
        // Toggle the active class
        menu.classList.toggle("active");
  
        // Expand or collapse the content
        if (content.classList.contains("expanded")) {
          content.style.height = "0";
          content.classList.remove("expanded");
        } else {
          content.style.height = content.scrollHeight + "px";
          content.classList.add("expanded");
        }
      });
    });
  });


function gsapAccordion() {
    let groups = gsap.utils.toArray(".gsap-accordion-group");
    let menus = gsap.utils.toArray(".gsap-accordion-menu");
    let menuToggles = groups.map(createGsapAnimation);

    menus.forEach((menu) => {
      menu.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleGsapMenu(menu);
      });
    });

    document.addEventListener("click", closeAllGsapMenus);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllGsapMenus();
      }
    });

    function toggleGsapMenu(clickedMenu) {
      menuToggles.forEach((toggleFn) => toggleFn(clickedMenu)); // Remove active class from child elements
      menus.filter(menu => menu !== clickedMenu).forEach(menu => {
        menu.closest('.gsap-accordion-group').querySelector('.gsap-accordion-menu').classList.remove('active');
      });
      // Toggle the active class on clicked menu
      let parentMenu = clickedMenu.closest('.gsap-accordion-group').querySelector('.gsap-accordion-menu');
      parentMenu.classList.toggle('active');
    }

    function closeAllGsapMenus(event) {
      if (!event || !event.target.closest || !event.target.closest('.gsap-accordion-group')) {
        menus.forEach(menu => {
          menu.closest('.gsap-accordion-group').querySelector('.gsap-accordion-menu').classList.remove('active');
        });
        menuToggles.forEach(toggleFn => toggleFn(null));
      }
    }

    function createGsapAnimation(element) {
      let menu = element.querySelector(".gsap-accordion-menu");
      let box = element.querySelector(".gsap-accordion-content");
      let minusElement = element.querySelector(".gsap-accordion-minus");
      let plusElement = element.querySelector(".gsap-accordion-plus");

      gsap.set(box, { height: "auto" });
      let animation = gsap.timeline()
        .from(box, { height: 0, duration: 0.5, ease: "power1.inOut" })
        .from(minusElement, { duration: 0.2, autoAlpha: 0, ease: "none" }, 0)
        .to(plusElement, { duration: 0.2, autoAlpha: 0, ease: "none" }, 0)
        .reverse();

      return function (clickedMenu) {
        if (clickedMenu === menu) {
          animation.reversed(!animation.reversed());
        } else {
          animation.reverse();
        }
      };
    }
  }

  gsapAccordion();














