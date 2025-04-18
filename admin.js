// تهيئة Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJ-PIDUWyOCtHkDRyfo98-Vho1nCMKxIw",
  authDomain: "restaurant-dashboard-b88c0.firebaseapp.com",
  projectId: "restaurant-dashboard-b88c0",
  storageBucket: "restaurant-dashboard-b88c0.appspot.com",
  messagingSenderId: "193783060494",
  appId: "1:193783060494:web:44d7e82826c959119d445f",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// حالة التطبيق
let currentUser = null;
let editingItemId = null;
let editingOfferId = null;
let currentUnsubscribe = null;

// عناصر DOM
const loadingScreen = document.getElementById("loading");
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const currentUserSpan = document.querySelector("#current-user span");
const menuItemsContainer = document.getElementById("menu-items");
const offersContainer = document.getElementById("offers-list");
const reviewsContainer = document.getElementById("reviews-list");
const addItemBtn = document.getElementById("add-item-btn");
const reviewModal = document.getElementById("review-modal");
const reviewModalTitle = document.getElementById("review-modal-title");
const reviewForm = document.getElementById("review-form");
const closeReviewModalBtn = document.querySelector("#review-modal .close-btn");
let selectedRating = 5;
const addOfferBtn = document.getElementById("add-offer-btn");
const itemModal = document.getElementById("item-modal");
const modalTitle = document.getElementById("item-modal-title");
const itemForm = document.getElementById("item-form");
const closeModalBtn = document.querySelector("#item-modal .close-btn");

// Create offer modal elements if they exist in HTML
const offerModal = document.getElementById("offer-modal");
const offerModalTitle = offerModal
  ? document.getElementById("offer-modal-title")
  : null;
const offerForm = offerModal ? document.getElementById("offer-form") : null;
const closeOfferModalBtn = offerModal
  ? document.querySelector("#offer-modal .close-btn")
  : null;

// Add event listener for review form if it exists
if (reviewForm) {
  reviewForm.addEventListener("submit", handleReviewSubmit);
}

// Add event listener for close review modal button if it exists
if (closeReviewModalBtn) {
  closeReviewModalBtn.addEventListener("click", () => closeReviewModal());
}

// تهيئة نجوم التقييم
document.addEventListener("DOMContentLoaded", function () {
  // باقي الكود الحالي...

  // إضافة أحداث النجوم
  const stars = document.querySelectorAll(".star-rating .fa-star");
  if (stars.length > 0) {
    stars.forEach((star) => {
      star.addEventListener("click", function () {
        const rating = parseInt(this.getAttribute("data-rating"));
        document.getElementById("review-rating").value = rating;
        updateStarDisplay(rating);
      });

      star.addEventListener("mouseover", function () {
        const rating = parseInt(this.getAttribute("data-rating"));
        highlightStars(rating);
      });
    });

    document
      .querySelector(".star-rating")
      .addEventListener("mouseout", function () {
        const currentRating = parseInt(
          document.getElementById("review-rating").value
        );
        highlightStars(currentRating);
      });
  }
});

// فتح نافذة إضافة تقييم
function openReviewModal() {
  reviewModalTitle.textContent = "إضافة تقييم جديد";
  reviewForm.reset();
  document.getElementById("review-rating").value = 5;
  updateStarDisplay(5);
  reviewModal.style.display = "flex";
}

// إغلاق نافذة التقييم المنبثقة
function closeReviewModal() {
  reviewModal.style.display = "none";
}

// تحديث عرض النجوم
function updateStarDisplay(rating) {
  const stars = document.querySelectorAll(".star-rating .fa-star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

// تظليل النجوم عند المرور عليها
function highlightStars(rating) {
  const stars = document.querySelectorAll(".star-rating .fa-star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("hover");
    } else {
      star.classList.remove("hover");
    }
  });
}

// معالجة إرسال نموذج التقييم
function handleReviewSubmit(e) {
  e.preventDefault();

  const userName = document.getElementById("review-username").value;
  const rating = parseInt(document.getElementById("review-rating").value);
  const comment = document.getElementById("review-comment").value;

  if (!userName || !comment || isNaN(rating)) {
    showError("الرجاء إدخال جميع الحقول المطلوبة");
    return;
  }

  const submitBtn = reviewForm.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

  const reviewData = {
    userName,
    rating,
    comment,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection("reviews")
    .add(reviewData)
    .then(() => {
      showSuccess("تم إضافة التقييم بنجاح");
      closeReviewModal();
    })
    .catch((error) => {
      console.error("Save error:", error);
      showError("حدث خطأ أثناء حفظ التقييم");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// إضافة الدوال للنافذة العالمية
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
// تهيئة التطبيق
document.addEventListener("DOMContentLoaded", function() {
  // إخفاء شاشة التحميل بعد 1.5 ثانية
  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
      checkAuthState();
    }, 500);
  }, 1500);

  // أحداث تسجيل الدخول
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // أحداث القائمة الجانبية
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      showSection(section);
    });
  });

  // أحداث النافذة المنبثقة للمنيو
  if (addItemBtn) {
    addItemBtn.addEventListener("click", () => openItemModal());
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => closeModal());
  }
  if (itemForm) {
    itemForm.addEventListener("submit", handleItemSubmit);
  }

  // أحداث النافذة المنبثقة للعروض
  if (addOfferBtn) {
    addOfferBtn.addEventListener("click", () => openOfferModal());
  }
  if (closeOfferModalBtn) {
    closeOfferModalBtn.addEventListener("click", () => closeOfferModal());
  }
  if (offerForm) {
    offerForm.addEventListener("submit", handleOfferSubmit);
  }
});

// التحقق من حالة المصادقة
function checkAuthState() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      currentUserSpan.textContent = user.email;
      loginSection.style.display = "none";
      dashboard.style.display = "block";
      showSection("menu");
    } else {
      if (currentUnsubscribe) currentUnsubscribe();
      loginSection.style.display = "flex";
      dashboard.style.display = "none";
    }
  });
}

// تسجيل الدخول
function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  if (!email || !password) {
    showError("الرجاء إدخال البريد الإلكتروني وكلمة السر");
    return;
  }

  const loginText = document.getElementById('login-text');
  const loginSpinner = document.getElementById('login-spinner');
  
  loginBtn.disabled = true;
  loginText.style.display = 'none';
  loginSpinner.style.display = 'block';

  auth.signInWithEmailAndPassword(email, password).catch((error) => {
    let errorMessage = "حدث خطأ أثناء تسجيل الدخول";

    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "بريد إلكتروني غير صالح";
        break;
      case "auth/user-disabled":
        errorMessage = "هذا الحساب معطل";
        break;
      case "auth/user-not-found":
        errorMessage = "لا يوجد حساب بهذا البريد";
        break;
      case "auth/wrong-password":
        errorMessage = "كلمة السر غير صحيحة";
        break;
    }

    showError(errorMessage);
    loginBtn.disabled = false;
    loginText.style.display = 'block';
    loginSpinner.style.display = 'none';
  });
}

// تسجيل الخروج
function handleLogout() {
  auth.signOut().catch((error) => {
    console.error("Logout error:", error);
    showError("حدث خطأ أثناء تسجيل الخروج");
  });
}

// عرض القسم المحدد
function showSection(sectionId) {
  // إلغاء الاشتراك الحالي
  if (currentUnsubscribe) currentUnsubscribe();

  // إخفاء جميع الأقسام
  document.querySelectorAll(".content-section").forEach((section) => {
    section.style.display = "none";
  });

  // إزالة التنشيط من جميع الأزرار
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // إظهار القسم المحدد وتنشيط الزر
  document.getElementById(sectionId).style.display = "block";
  document
    .querySelector(`.menu-btn[data-section="${sectionId}"]`)
    .classList.add("active");

  // تحميل محتوى القسم مع المتابعة
  switch (sectionId) {
    case "menu":
      currentUnsubscribe = loadMenuItems();
      break;
    case "offers":
      currentUnsubscribe = loadOffers();
      break;
    case "reviews":
      currentUnsubscribe = loadReviews();
      break;
  }
}

// تحميل عناصر المنيو مع المتابعة
function loadMenuItems() {
  menuItemsContainer.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>جاري تحميل قائمة الطعام...</p></div>';

  return db
    .collection("menu")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (querySnapshot) => {
        if (querySnapshot.empty) {
          menuItemsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-utensils"></i>
                            <p>لا توجد أصناف متاحة حالياً</p>
                            <button onclick="openItemModal()">إضافة صنف جديد</button>
                        </div>
                    `;
          return;
        }

        menuItemsContainer.innerHTML = "";
        querySnapshot.forEach((doc) => {
          renderMenuItem(doc.id, doc.data());
        });
      },
      (error) => {
        console.error("Error loading menu:", error);
        showError("حدث خطأ في تحميل قائمة الطعام");
        menuItemsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>حدث خطأ في تحميل البيانات</p>
                        <button onclick="loadMenuItems()">إعادة المحاولة</button>
                    </div>
                `;
      }
    );
}

// عرض عنصر في القائمة
function renderMenuItem(id, item) {
  const itemCard = document.createElement("div");
  itemCard.className = "item-card";
  itemCard.innerHTML = `
        <div class="item-image">
            ${
              item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${item.name}">`
                : `<i class="fas fa-utensils"></i>`
            }
        </div>
        <div class="item-details">
            <h3>${item.name}</h3>
            <p>${item.description || "لا يوجد وصف"}</p>
            <div class="item-meta">
                <span class="price">${item.price} جنيه</span>
                <span class="category">${getCategoryName(item.category)}</span>
            </div>
            <div class="item-actions">
                <button class="edit-btn" data-id="${id}">تعديل</button>
                <button class="delete-btn" data-id="${id}">حذف</button>
            </div>
        </div>
    `;

  menuItemsContainer.appendChild(itemCard);

  // إضافة أحداث للأزرار
  itemCard
    .querySelector(".edit-btn")
    .addEventListener("click", () => editMenuItem(id));
  itemCard
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteMenuItem(id));
}

// فتح نافذة إضافة/تعديل صنف
function openItemModal(item = null) {
  if (item) {
    modalTitle.textContent = "تعديل الصنف";
    document.getElementById("item-name").value = item.name;
    document.getElementById("item-price").value = item.price;
    document.getElementById("item-category").value = item.category || "";
    document.getElementById("item-description").value = item.description || "";
    editingItemId = item.id;
  } else {
    modalTitle.textContent = "إضافة صنف جديد";
    itemForm.reset();
    editingItemId = null;
  }

  itemModal.style.display = "flex";
}

// إغلاق النافذة المنبثقة
function closeModal() {
  itemModal.style.display = "none";
  document.getElementById("item-image").value = "";
  editingItemId = null;
}

// معالجة إرسال نموذج المنيو
function handleItemSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("item-name").value;
  const price = document.getElementById("item-price").value;
  const category = document.getElementById("item-category").value;
  const description = document.getElementById("item-description").value;
  const imageFile = document.getElementById("item-image").files[0];

  if (!name || !price || !category) {
    showError("الرجاء إدخال جميع الحقول المطلوبة");
    return;
  }

  const submitBtn = itemForm.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

  const itemData = {
    name,
    price: Number(price),
    category, // تأكد من وجود هذا الحقل
    description,
    isActive: true, // أضف هذا الحقل
    order: 0, // أضف هذا الحقل للترتيب
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // إذا كان إضافة جديد، أضف تاريخ الإنشاء
  if (!editingItemId) {
    itemData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  // إذا كان هناك صورة يتم رفعها
  if (imageFile) {
    const storageRef = storage.ref(
      `menu-images/${editingItemId || Date.now()}`
    );

    storageRef
      .put(imageFile)
      .then((snapshot) => snapshot.ref.getDownloadURL())
      .then((url) => {
        itemData.imageUrl = url;
        saveMenuItem(itemData);
      })
      .catch((error) => {
        console.error("Upload error:", error);
        showError("حدث خطأ أثناء رفع الصورة");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  } else {
    saveMenuItem(itemData);
  }

  function saveMenuItem(data) {
    const promise = editingItemId
      ? db.collection("menu").doc(editingItemId).update(data)
      : db.collection("menu").add(data);

    promise
      .then(() => {
        showSuccess("تم حفظ البيانات بنجاح");
        closeModal();
      })
      .catch((error) => {
        console.error("Save error:", error);
        showError("حدث خطأ أثناء حفظ البيانات");
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  }
}

// تعديل صنف
function editMenuItem(id) {
  db.collection("menu")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const item = doc.data();
        item.id = doc.id;
        openItemModal(item);
      }
    })
    .catch((error) => {
      console.error("Error getting item:", error);
      showError("حدث خطأ أثناء جلب بيانات الصنف");
    });
}

// حذف صنف
function deleteMenuItem(id) {
  if (!confirm("هل أنت متأكد من حذف هذا الصنف؟")) return;

  db.collection("menu")
    .doc(id)
    .delete()
    .then(() => {
      showSuccess("تم حذف الصنف بنجاح");
    })
    .catch((error) => {
      console.error("Delete error:", error);
      showError("حدث خطأ أثناء حذف الصنف");
    });
}

// تحميل العروض مع المتابعة
function loadOffers() {
  offersContainer.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>جاري تحميل العروض...</p></div>';

  return db
    .collection("offers")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (querySnapshot) => {
        if (querySnapshot.empty) {
          offersContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-percent"></i>
                            <p>لا توجد عروض متاحة حالياً</p>
                            <button onclick="openOfferModal()">إضافة عرض جديد</button>
                        </div>
                    `;
          return;
        }

        offersContainer.innerHTML = "";
        querySnapshot.forEach((doc) => {
          renderOffer(doc.id, doc.data());
        });
      },
      (error) => {
        console.error("Error loading offers:", error);
        showError("حدث خطأ في تحميل العروض");
        offersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>حدث خطأ في تحميل البيانات</p>
                        <button onclick="loadOffers()">إعادة المحاولة</button>
                    </div>
                `;
      }
    );
}

// عرض عرض في القائمة
function renderOffer(id, offer) {
  const offerCard = document.createElement("div");
  offerCard.className = "offer-card";
  offerCard.innerHTML = `
        <div class="offer-details">
            <h3>${offer.title}</h3>
            <p>${offer.description || "لا يوجد وصف"}</p>
            <div class="offer-actions">
                <button class="edit-btn" data-id="${id}">تعديل</button>
                <button class="delete-btn" data-id="${id}">حذف</button>
            </div>
        </div>
    `;

  offersContainer.appendChild(offerCard);

  // إضافة أحداث للأزرار
  offerCard
    .querySelector(".edit-btn")
    .addEventListener("click", () => editOffer(id));
  offerCard
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteOffer(id));
}

// فتح نافذة إضافة/تعديل عرض
function openOfferModal(offer = null) {
  if (offer) {
    offerModalTitle.textContent = "تعديل العرض";
    document.getElementById("offer-title").value = offer.title;
    document.getElementById("offer-description").value =
      offer.description || "";
    editingOfferId = offer.id;
  } else {
    offerModalTitle.textContent = "إضافة عرض جديد";
    offerForm.reset();
    editingOfferId = null;
  }

  offerModal.style.display = "flex";
}

// إغلاق نافذة العروض المنبثقة
function closeOfferModal() {
  offerModal.style.display = "none";
  editingOfferId = null;
}

// معالجة إرسال نموذج العروض
function handleOfferSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("offer-title").value;
  const description = document.getElementById("offer-description").value;

  if (!title || !description) {
    showError("الرجاء إدخال العنوان والوصف");
    return;
  }

  const submitBtn = offerForm.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

  const offerData = {
    title,
    description,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  // إذا كان إضافة جديد، أضف تاريخ الإنشاء
  if (!editingOfferId) {
    offerData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  const promise = editingOfferId
    ? db.collection("offers").doc(editingOfferId).update(offerData)
    : db.collection("offers").add(offerData);

  promise
    .then(() => {
      showSuccess("تم حفظ العرض بنجاح");
      closeOfferModal();
    })
    .catch((error) => {
      console.error("Save error:", error);
      showError("حدث خطأ أثناء حفظ العرض");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// تعديل عرض
function editOffer(id) {
  db.collection("offers")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const offer = doc.data();
        offer.id = doc.id;
        openOfferModal(offer);
      }
    })
    .catch((error) => {
      console.error("Error getting offer:", error);
      showError("حدث خطأ أثناء جلب بيانات العرض");
    });
}

// حذف عرض
function deleteOffer(id) {
  if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;

  db.collection("offers")
    .doc(id)
    .delete()
    .then(() => {
      showSuccess("تم حذف العرض بنجاح");
    })
    .catch((error) => {
      console.error("Delete error:", error);
      showError("حدث خطأ أثناء حذف العرض");
    });
}

// تحميل التقييمات مع المتابعة
function loadReviews() {
  reviewsContainer.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>جاري تحميل التقييمات...</p></div>';

  return db
    .collection("reviews")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (querySnapshot) => {
        if (querySnapshot.empty) {
          reviewsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-star"></i>
                            <p>لا توجد تقييمات حالياً</p>
                            <button onclick="openReviewModal()">إضافة تقييم جديد</button>
                        </div>
                    `;
          return;
        }

        reviewsContainer.innerHTML = "";
        querySnapshot.forEach((doc) => {
          renderReview(doc.id, doc.data());
        });
      },
      (error) => {
        console.error("Error loading reviews:", error);
        showError("حدث خطأ في تحميل التقييمات");
        reviewsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>حدث خطأ في تحميل البيانات</p>
                        <button onclick="loadReviews()">إعادة المحاولة</button>
                    </div>
                `;
      }
    );
}

// عرض تقييم في القائمة
function renderReview(id, review) {
  const reviewCard = document.createElement("div");
  reviewCard.className = "review-card";

  // إنشاء نجوم التقييم
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star ${
      i <= review.rating ? "active" : ""
    }"></i>`;
  }

  reviewCard.innerHTML = `
        <div class="review-header">
            <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <span>${review.userName || "مستخدم مجهول"}</span>
            </div>
            <div class="review-rating">
                ${stars}
            </div>
        </div>
        <div class="review-content">
            <p>${review.comment || "لا يوجد تعليق"}</p>
        </div>
        <div class="review-actions">
            <button class="delete-btn" data-id="${id}">حذف</button>
        </div>
    `;

  reviewsContainer.appendChild(reviewCard);

  // إضافة أحداث للأزرار
  reviewCard
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteReview(id));
}

// حذف تقييم
function deleteReview(id) {
  if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;

  db.collection("reviews")
    .doc(id)
    .delete()
    .then(() => {
      showSuccess("تم حذف التقييم بنجاح");
    })
    .catch((error) => {
      console.error("Delete error:", error);
      showError("حدث خطأ أثناء حذف التقييم");
    });
}

// دوال مساعدة
function showError(message) {
  loginError.textContent = message;
  setTimeout(() => {
    loginError.textContent = "";
  }, 5000);
}

function showSuccess(message) {
  const alert = document.createElement("div");
  alert.className = "alert success";
  alert.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
  document.body.appendChild(alert);

  setTimeout(() => {
    alert.classList.add("fade-out");
    setTimeout(() => alert.remove(), 500);
  }, 3000);
}

function getCategoryName(category) {
  const categories = {
    grilled: "مشويات",
    broasted: "بروست",
    trays: "صواني",
    drinks: "مشروبات",
  };
  return categories[category] || category;
}

// جعل الدوال متاحة عالمياً للاستدعاء من HTML
window.openItemModal = openItemModal;
window.closeModal = closeModal;
window.loadMenuItems = loadMenuItems;
window.openOfferModal = openOfferModal;
window.closeOfferModal = closeOfferModal;
window.loadOffers = loadOffers;
window.loadReviews = loadReviews;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.editOffer = editOffer;
window.deleteOffer = deleteOffer;
window.deleteReview = deleteReview;
window.handleItemSubmit = handleItemSubmit;
window.handleOfferSubmit = handleOfferSubmit;
window.handleReviewSubmit = handleReviewSubmit;