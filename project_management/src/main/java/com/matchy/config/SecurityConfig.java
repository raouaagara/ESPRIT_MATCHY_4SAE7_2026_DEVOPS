package com.matchy.config;

import com.matchy.security.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtUtil jwtUtil;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                // Public read endpoints to avoid breaking front pages
                .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/proposals/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/freelancers/**", "/api/availability/**", "/api/market/**", "/api/stats/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/notifications/**").authenticated()
                .requestMatchers("/api/users/stats/dashboard", "/api/users/role/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority("ADMIN")
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/projects/**").hasAnyAuthority("CLIENT", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/projects/**").hasAnyAuthority("CLIENT", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/projects/**").hasAnyAuthority("CLIENT", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/projects/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/proposals/**").hasAnyAuthority("FREELANCER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/proposals/**").hasAnyAuthority("CLIENT", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/proposals/**").hasAnyAuthority("ADMIN", "FREELANCER")
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/matching/**", "/api/predictions/**", "/api/ai/**", "/api/chat/**", "/api/wallet/**", "/api/badges/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(h -> h.frameOptions(f -> f.disable()))
            .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public OncePerRequestFilter jwtFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest req,
                                            HttpServletResponse res,
                                            FilterChain chain)
                    throws ServletException, IOException {

                if (HttpMethod.OPTIONS.matches(req.getMethod())) {
                    chain.doFilter(req, res);
                    return;
                }

                String header = req.getHeader("Authorization");

                if (header != null && header.startsWith("Bearer ")) {
                    String token = header.substring(7);

                    if (jwtUtil.isValid(token)) {
                        Claims claims = jwtUtil.parseToken(token);
                        String role = claims.get("role", String.class);

                        UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                claims.getSubject(),
                                null,
                                List.of(new SimpleGrantedAuthority(role))
                            );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        req.setAttribute("userId",    claims.getSubject());
                        req.setAttribute("userRole",  claims.get("role",      String.class));
                        req.setAttribute("userEmail", claims.get("email",     String.class));
                        // ✅ Added firstName & lastName
                        req.setAttribute("firstName", claims.get("firstName", String.class));
                        req.setAttribute("lastName",  claims.get("lastName",  String.class));
                    } else {
                        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        return;
                    }
                }

                chain.doFilter(req, res);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:4200"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}