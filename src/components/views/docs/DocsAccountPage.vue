<template>
  <div class="docs-article">
    <h1 class="docs-article__title">Account &amp; team</h1>
    <p class="docs-article__lead">Profile, API tokens, admins, and audit history.</p>
    <div class="docs-article__body">
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Who</th>
              <th>Contents</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <RouterLink :to="{ name: 'users-information' }">Profile</RouterLink>
              </td>
              <td>Everyone</td>
              <td>Name, email, password, activity; create &amp; revoke API tokens</td>
            </tr>
            <tr>
              <td>
                <RouterLink :to="{ name: 'users' }">Team</RouterLink>
              </td>
              <td>Admin</td>
              <td>Add / edit / block users · roles Admin or User · optional edge scope</td>
            </tr>
            <tr>
              <td>
                <RouterLink :to="{ name: 'users-history' }">Audit log</RouterLink>
              </td>
              <td>Admin</td>
              <td>Searchable history: auth, edge, site, WAF, L4, and more</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="docs-bullets">
        <li>
          API token secrets are shown once at creation — copy them immediately. Scope
          <code class="num">*</code> grants full API access for that token.
        </li>
        <li>Regular Users manage their own profile; only Admins see Team and Audit log.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
