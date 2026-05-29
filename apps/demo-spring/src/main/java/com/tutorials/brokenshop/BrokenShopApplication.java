package com.tutorials.brokenshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/*
 * FIXME: SB4-1 — Virtual threads (Loom) are a flagship Spring Boot 4 + Java 21 feature.
 * They are NOT enabled here. Add to application.yml:
 *
 *   spring.threads.virtual.enabled: true
 *
 * That single line switches Tomcat to handle every request on a virtual thread, so
 * blocking JDBC calls don't pin a platform thread. The "right" answer to "how do I
 * make Spring Boot scale" used to be "go reactive" — in SB4 + JDK 21+, it's usually
 * "turn this on."
 *
 * FIXME: SB4-2 — No native-image / AOT support tested. SB4 fully supports GraalVM
 * native compilation. Try: `mvn -Pnative native:compile` (after adding the native
 * profile from spring-boot-starter-parent).
 */
@SpringBootApplication
public class BrokenShopApplication {
  public static void main(String[] args) {
    SpringApplication.run(BrokenShopApplication.class, args);
  }
}
