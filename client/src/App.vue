<script setup>
// RouterView is the place where Vue Router displays the page
// that matches the current address in the browser.
import { RouterView } from 'vue-router'
</script>

<template>
  <!--
    Vue Router will put the current page here:
    LoginPage for /login, MainTank for /main-tank, and so on.
  -->
  <RouterView />
</template>

<style scoped></style>
