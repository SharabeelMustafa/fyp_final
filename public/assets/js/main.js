
function NavClose() {
    $(".side-menu").removeClass("side-width");
    $(".bg-img").attr("src", "./assets/images/bg-imgs/sidnav-half.png");
    $(".hide-show").addClass("d-none");
    $(".half-nav-icons").removeClass("pe-3");
}
function NavOpen() {
    $(".side-menu").addClass("side-width");
    $(".bg-img").attr("src", "./assets/images/bg-imgs/sidenav-full.png");
  // $(".list-hide").removeClass("d-none");
  $(".half-nav-icons").addClass("pe-3");

  setTimeout(() => {
    $(".hide-show").removeClass("d-none");
  }, 150);
}
$(document).ready(function () {
  $(".side-menu").hover(
      function () {
          NavOpen();
      },
      function () {
        setTimeout(() => {
          
          NavClose();
          
      }, 100);
      }
  );
function NavHide() {
  $("#side-bar").toggleClass("Sidenavhide");
  $(".page-wrapper").toggleClass("content-gap");
}
  if ($(window).width() < 767.5) {
    NavHide();
  }
  $('#my-text-field').focus(function () {
    $(this).parent().find('label').addClass('active');
  }).blur(function () {
    if ($(this).val() === '') {
      $(this).parent().find('label').removeClass('active');
    }
  });
  $(".side-menu").hover(
    function () {
      $(".Navigation-active").removeClass("small-active");
    },
    function () {
      setTimeout(() => {
        $(".Navigation-active").addClass("small-active");
      }, 100);
    }
  );
  $(".accordion-item").click(function(){
    $(this).toggleClass("active-border");
    });
});


// ********======(((DATEPICKER JQ)))======********
$(function () {
  $("#clock-in-out").daterangepicker({
      timePicker: false,
      startDate: moment().startOf("hour"),
      endDate: moment().startOf("hour").add(1, "hour"),
      locale: {
          format: "DD/MM/YYYY"
      }
  });
});
$(document).ready(function() {
  $('.image-input').on('change', function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    var selectedDiv = $(this).closest('.property-imgs');
    reader.onload = function(e) {
      var imageData = e.target.result;
      selectedDiv.find('.uploaded-image').attr('src', imageData);
    };
    reader.readAsDataURL(file);
  });

  $('.del-icon').click(function(){
    $(this).siblings('.property-imgs').children('.image-preview').children('.uploaded-image').attr('src', '/assets/images/Forms-icon/upload-icon-property.png');
  });



  
  $('.img-uploder').on('change', function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      $('.uploade-img').attr('src', e.target.result);
    };
    reader.readAsDataURL(file);
  });
});
// img-uploed
$(document).ready(function() {
$("#file-input").on("change", function () {
  var files = $(this).get(0).files;
  for (var i = 0; i < files.length; i++) {
      var image = $("<img>").addClass("uploaded-image").attr("src", URL.createObjectURL(files[i]));
      var div = $("<div>").addClass("upload-gallery-image").append('<div class="del-icon"><img src="./assets/images/ProductListing-icons/close-icon.png" alt=""></div>');
      var main = div.append(image);
      // append(image)
      $(".image-containers").append(main);
  }
  $(this).val("");
});

$('.image-containers').on('click', '.del-icon', function() {
  $(this).closest('.upload-gallery-image').remove();
});
}); 

